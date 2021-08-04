const {app} = require('./accountServer.js');
const session = require('./session');
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

        if (req.body.eorn && req.body.password) {
            account.login(req.body.eorn.toString(), req.body.password.toString()).then((returnValue) => {
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

}

function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function validateSignUp(name, email, password) {

    if (name && password && email) {
        if (name.toString().trim() != '' && password.toString().trim() != '' && email.toString().trim() != '') {
            if (validateEmail(email.toString())) {

                if (name.toString().trim().length >= 3) {


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
