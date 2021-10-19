const {app} = require('./accountServer.js');
const session = require('sessionlib/session');
const account = require('./account')
const axios = require("axios");

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
        if (req.body.eorn!=null && req.body.password!=null) {
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
        if (req.body.session!=null) {
            //TODO check permission
            session.deleteSession(req.body.session.toString()).then((returnValue) => {
                res.send(returnValue);
            });
        } else {
            res.send('{\"error\":\"please provide valid session!\",\"errorcode\":\"001\"}');
        }

    });


    app.post("/api/v1/auth/validateStreamKey", (req, res) => {

        if(req.body.apiKey&&req.body.name) {

            session.checkStreamPermission(req.body.name,req.body.apiKey).then(result=>{

                if(result) {
                    res.status(200).send();
                }else{
                    res.status(400).send();
                }

            });


        }else{
            res.status(400).send();
        }
    });


    app.get('/api/v1/auth/validateSession', (req, res) => {


        if (req.query.session!=null) {
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

        if (req.body.session!=null) {
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
  app.post('/api/v1/auth/startSessionWithGoogle', (req, res) => {

        if (req.body.token) {
            axios(`https://oauth2.googleapis.com/tokeninfo?id_token=${req.body.token}`).then(response => {
                if(!response.data.error&&response.data.aud==="213041413684-upirs2j8p9ute8tjohkd1bqpnrqv49h8.apps.googleusercontent.com") {

                    account.getAccountByGoogleID(response.data).then((accountResult)=>{
                        if(accountResult!==undefined) {
                            account.setGoogleAccountDetails(accountResult.uuid, response.data).then(r =>{});
                            const sessionUUID = session.startsession(accountResult.uuid,60);
                            res.json({session: sessionUUID,success:true});
                        }else{
                            res.send('{\"error\":\"No Google-Account Link\",\"errorcode\":\"013\"}');

                        }
                    })

                }else{
                    res.send('{\"error\":\"No valid google token!\",\"errorcode\":\"014\"}');


                }

            }).catch((error)=>{
                res.json({valid: false})
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

            const regex = /[^A-Za-z0-9\s]/;
            if(!regex.test(name.toString())) {
            if (validateEmail(email.toString())) {

                if (name.toString().trim().length >= 3&&name.toString().length<=25) {


                    return undefined;

                } else {
                    return '{\"error\":\"Username must contain at least 3 Characters\",\"errorcode\":\"014\"}';

                }


            } else {
                return '{\"error\":\"No valid email!\",\"errorcode\":\"002\"}';
            }
            } else {
                return '{\"error\":\"Invalid Characters\",\"errorcode\":\"013\"}';

            }

        } else {
            return '{\"error\":\"No valid inputs!\",\"errorcode\":\"002\"}';

        }

    } else {
        return '{\"error\":\"please provide name, password and email!\",\"errorcode\":\"001\"}';
    }
}
