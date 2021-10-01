var account = require('./account');
var session = require('sessionlib/session');

const {app} = require('./accountServer.js');
const axios = require("axios");


module.exports.init = function initAccountPaths() {
//TODO add info function without session instead uuid of account

    app.get('/api/v1/account/info', (req, res) => {

        if (req.query.session!=null) {
            session.validateSession(req.query.session.toString(), (isValid) => {
                if (isValid) {
                    session.reactivateSession(req.query.session);
                    session.getUserUUID(req.query.session.toString(), (uuid) => {

                        if (uuid) {
                            account.getAccountByUUID(uuid).then((account) => {
                                if (account) {
                                    res.send(JSON.stringify(account));
                                } else {
                                    res.send();
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

    //TODO undocumented
    app.get('/api/v1/account/isUserAdmin', (req, res) => {

        if (req.query.uuid!=null) {

            account.isUserAdmin(req.query.uuid).then((admin) => {
                res.send(JSON.stringify({isAdmin: admin}));
            });
                 

        } else {
            res.send('{\"error\":\"No valid inputs!\",\"errorcode\":\"002\"}');
        }

    });
    app.get('/api/v1/account/amIAdmin', (req, res) => {


        if (req.query.session!=null) {

            session.getUserUUID(req.query.session,(uuid)=> {
                if(uuid) {

                    account.isUserAdmin(uuid).then((admin) => {
                        res.send(JSON.stringify({isAdmin: admin}));
                    });

                }else {
                    res.send('{\"error\":\"No valid account!\",\"errorcode\":\"006\"}');
                }
            })


        } else {
            res.send('{\"error\":\"No valid inputs!\",\"errorcode\":\"002\"}');
        }

    });

    app.get('/api/v1/account/getSettings', (req, res) => {

        if (req.query.session!=null) {
            session.validateSession(req.query.session.toString(), (isValid) => {
                if (isValid) {
                    session.reactivateSession(req.query.session);
                    session.getUserUUID(req.query.session.toString(), (uuid) => {

                        if (uuid) {
                            account.getAccountSettings(uuid, (settings) => {
                                if (settings) {
                                    res.send(settings);
                                } else {
                                    res.send();
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
    app.post("/api/v1/account/changeSetting",(req,res)=> {
        if (req.body.session!=null&&req.body.key!=null&&req.body.newValue!=null) {
                session.validateSession(req.body.session.toString(), (isValid) => {
                    if (isValid) {
                        session.reactivateSession(req.body.session);
                        session.getUserUUID(req.body.session.toString(), (uuid) => {
                            if (uuid) {
                                account.getAccountSettings(uuid,settings=> {
                                    settings[req.body.key] = req.body.newValue;

                                    account.storeAccountSettings(uuid,settings).then(()=> {
                                        res.json({
                                            success: true
                                        })
                                    })
                                })
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
    })





    app.post("/api/v1/account/changeUsername",(req,res) => {

        if (req.body.session!=null&&req.body.newUsername!=null) {
            if(req.body.newUsername.toString().trim().length>=3&&req.body.newUsername.toString().length<=25) {
                const regex = /[^A-Za-z0-9\s]/;
                if(!regex.test(req.body.newUsername.toString())) {
                session.validateSession(req.body.session.toString(), (isValid) => {
                    if (isValid) {
                        session.reactivateSession(req.body.session);
                        session.getUserUUID(req.body.session.toString(), (uuid) => {
                            if (uuid) {
                                account.checkUsernameExisting(req.body.newUsername.toString()).then(available => {
                                    if(available) {
                                        account.changeUsername(uuid,req.body.newUsername.toString()).then(()=> {
                                            res.json({
                                                success: true
                                            })
                                        })
                                    }else{
                                        res.send('{\"error\":\"Username already exists\",\"errorcode\":\"004\"}');
                                    }

                                })


                            } else {
                                res.send('{\"error\":\"No valid account!\",\"errorcode\":\"006\"}');

                            }
                        });

                    } else {
                        res.send('{\"error\":\"No valid session!\",\"errorcode\":\"006\"}');

                    }
                });
                }else {
                    res.send('{\"error\":\"Invalid Characters\",\"errorcode\":\"013\"}');
                }

            }else {
                res.send('{\"error\":\"Username must contain at least 3 Characters\",\"errorcode\":\"014\"}');
            }
        } else {
            res.send('{\"error\":\"No valid inputs!\",\"errorcode\":\"002\"}');
        }
    })
/*
    app.post("/api/v1/account/changeGoogleAuth",(req,res)=> {
        if (req.body.session&&req.body.token) {
            session.validateSession(req.body.session.toString(), (isValid) => {
                if (isValid) {
                    session.reactivateSession(req.body.session);
                    session.getUserUUID(req.body.session.toString(), (uuid) => {
                        if (uuid) {

                            axios(`https://oauth2.googleapis.com/tokeninfo?id_token=${req.body.token.toString()}`).then(response => {
                                if(!response.data.error&&response.data.aud==="213041413684-upirs2j8p9ute8tjohkd1bqpnrqv49h8.apps.googleusercontent.com") {

                                    account.setGoogleToken(uuid,response.data.sub,response.data).then(()=>{
                                        res.json({success:true})
                                    })
                                }else{
                                    res.send('{\"error\":\"No valid google token!\",\"errorcode\":\"014\"}');


                                }

                            }).catch((error)=>{
                                res.send('{\"error\":\"No valid google token!\",\"errorcode\":\"014\"}');

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
    })

    app.post("/api/v1/account/deleteGoogleAuth",(req,res)=> {
        if (req.body.session) {
            session.validateSession(req.body.session.toString(), (isValid) => {
                if (isValid) {
                    session.reactivateSession(req.body.session);
                    session.getUserUUID(req.body.session.toString(), (uuid) => {
                        if (uuid) {

                                    account.setGoogleToken(uuid,"-1",{}).then(()=>{
                                        res.json({success:true})
                                    })

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
    })

    app.get("/api/v1/account/checkGoogleAuth",(req,res)=> {
        if (req.query.session) {
            session.validateSession(req.query.session.toString(), (isValid) => {
                if (isValid) {
                    session.reactivateSession(req.query.session);
                    session.getUserUUID(req.query.session.toString(), (uuid) => {
                        if (uuid) {
                            account.getGoogleToken(uuid).then(token => {

                                if(token.googleid!=="-1") {
                                    res.json({valid: true,googleResponse: token.googleDetails})

                                }else{
                                    res.json({valid: false})

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
    })
*/

};
