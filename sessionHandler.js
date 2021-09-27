const {app} = require('./accountServer.js');
const session = require('sessionlib/session');
const account = require('./account')

module.exports.init = function initSessionPaths() {

    app.post('/api/v1/auth/signup', (req, res) => {

        const error = validateSignUp(req.body.name, req.body.email, req.body.password);
        if (error) {
            res.send(error);
        } else {
            account.checkAndCreateUser(req.body.name.toString(), req.body.email.toString(),req.body.password.toString()).then((returnValue)=> {
                res.send(returnValue);
            });

        }
    });


    app.post('/api/v1/auth/signin', (req, res) => {
        //TODO sessionTime is undocumented in signin
        if (req.body.eorn && req.body.password) {
            if(req.body.sessionTime) {
                if(req.body.sessionTime>(60*24*14)&&req.body.sessionTime>10) {
                    res.send('{\"error\":\"session time is too long or too short\",\"errorcode\":\"012\"}');
                    return;
                }
            }

            account.login(req.body.eorn.toString(), req.body.password.toString(),req.body.sessionTime?req.body.sessionTime:undefined).then((returnValue) => {
                res.send(returnValue);
            });
        } else {
            res.send('{\"error\":\"please provide name or email and password!\",\"errorcode\":\"001\"}');

        }
    });
    app.post('/api/v1/auth/signout', (req, res) => {
        if (req.body.session) {
            //TODO check permission
            session.deleteSession(req.body.session.toString()).then((returnValue) => {
                res.send(returnValue);
            });
        } else {
            res.send('{\"error\":\"please provide valid session!\",\"errorcode\":\"001\"}');
        }

    });

    app.get('/api/v1/auth/validateSession', (req, res) => {


        if (req.query.session) {
            session.validateSession(req.query.session.toString(), (result) => {
                if (result) {
                    res.send("{\"success\": true}");

                } else {

                    res.send("{\"success\": false}");

                }
            });
        } else {
            res.send('{\"error\":\"please provide valid session!\",\"errorcode\":\"001\",\"success\":false}');
        }
    });

    app.post('/api/v1/auth/addAPIKey', (req, res) => {

        if (req.body.session) {
            session.validateSession(req.body.session.toString(), (isValid) => {
                if (isValid) {
                    session.reactivateSession(req.body.session);
                    session.getUserUUID(req.body.session.toString(), (uuid) => {
                        if (uuid) {
                            const AddUuid = "unknown";
                            session.generateAPIKey(uuid, AddUuid, (apiKey) => {


                                //Store User Device

                                //Answer Request
                                res.send(`{"success":"${apiKey}"}`);


                            });


                        } else {
                            res.send('{\"error\":\"No valid account!\",\"errorcode\":\"006\"}');

                        }

                    });

                } else {
                    res.send('{\"error\":\"No valid session!\",\"errorcode\":\"006\"}');

                }
            });
        } else {
            res.send('{\"error\":\"No valid inputs!\",\"errorcode\":\"002\"}');
        }

    });
    /*
    //TODO here we have to find the account by google email or directly by token. In the current database structure that is very complicated because all oauth methods are stored in just one field and because we have a sql database that can be very slow
    app.get('/api/v1/auth/startSessionWithGoogle', (req, res) => {

        if (req.query.session) {
            session.validateSession(req.query.session.toString(), (isValid) => {
                if (isValid) {
                    session.reactivateSession(req.query.session);
                    session.getUserUUID(req.query.session.toString(), (uuid) => {

                        if (uuid) {
                            account.getAccountAuth(uuid, (settings) => {
                                const parsedSettings =JSON.parse(settings);
                                if (parsedSettings.googleToken) {

                                } else {
                                    res.send('{\"error\":\"No Google-Account Link\",\"errorcode\":\"013\"}');
                                }
                            });
                        } else {
                            res.send('{\"error\":\"No valid account!\",\"errorcode\":\"006\"}');
                        }
                    });

                } else {
                    res.send('{\"error\":\"No valid session!\",\"errorcode\":\"006\"}');

                }
            });
        } else {
            res.send('{\"error\":\"No valid inputs!\",\"errorcode\":\"002\"}');
        }

    });

     */


    setInterval(deleteSessions, 1000 * 60 * 2);

}
function deleteSessions() {
    const session = global.database.collection("session");
    session.deleteOne({isToken: {$ne: true},timeout: {$lte: Date.now()}})

}
function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function validateSignUp(name, email, password) {

    if (name && password && email) {
        if (name.toString().trim() != '' && password.toString().trim() != '' && email.toString().trim() != '') {
            if (validateEmail(email.toString())) {

                if (name.toString().trim().length >= 3&&name.toString().length<=25) {


                    return undefined;

                } else {
                    return '{\"error\":\"Username must contain at least 3 Characters\",\"errorcode\":\"002\"}';

                }


            } else {
                return '{\"error\":\"No valid email!\",\"errorcode\":\"002\"}';
            }

        } else {
            return '{\"error\":\"No valid inputs!\",\"errorcode\":\"002\"}';

        }

    } else {
        return '{\"error\":\"please provide name, password and email!\",\"errorcode\":\"001\"}';
    }
}
