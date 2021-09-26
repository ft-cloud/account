var account = require('./account');
var session = require('sessionlib/session');

const {app} = require('./accountServer.js');


module.exports.init = function initAccountPaths() {
//TODO add info function without session instead uuid of account

    app.get('/api/v1/account/info', (req, res) => {

        if (req.query.session) {
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

        if (req.query.uuid) {

            account.isUserAdmin(req.query.uuid).then((admin) => {
                res.send(JSON.stringify({isAdmin: admin}));
            });
                 

        } else {
            res.send('{\"error\":\"No valid inputs!\",\"errorcode\":\"002\"}');
        }

    });
    app.get('/api/v1/account/amIAdmin', (req, res) => {


        if (req.query.session) {

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

        if (req.query.session) {
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
        if (req.body.session&&req.body.key.toString()&&req.body.newValue.toString()) {
                session.validateSession(req.body.session.toString(), (isValid) => {
                    if (isValid) {
                        session.reactivateSession(req.body.session);
                        session.getUserUUID(req.body.session.toString(), (uuid) => {
                            if (uuid) {
                                account.getAccountSettings(uuid,settings=> {
                                    const parsedSettings = JSON.parse(settings);
                                    parsedSettings[req.body.key] = req.body.newValue;

                                    account.storeAccountSettings(uuid,JSON.stringify(parsedSettings)).then(()=> {
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

        if (req.body.session&&req.body.newUsername) {
            if(req.body.newUsername.toString().trim().length>=3&&req.body.newUsername.toString().length<=25) {
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
                res.send('{\"error\":\"Username must contain at least 3 Characters\",\"errorcode\":\"002\"}');
            }
        } else {
            res.send('{\"error\":\"No valid inputs!\",\"errorcode\":\"002\"}');
        }
    })

    app.post("/api/v1/account/changeAuth",(req,res)=> {
        if (req.body.session&&req.body.key.toString()&&req.body.newValue.toString()) {
            session.validateSession(req.body.session.toString(), (isValid) => {
                if (isValid) {
                    session.reactivateSession(req.body.session);
                    session.getUserUUID(req.body.session.toString(), (uuid) => {
                        if (uuid) {
                            account.getAccountAuth(uuid,settings=> {
                                const parsedSettings = JSON.parse(settings);
                                parsedSettings[req.body.key] = req.body.newValue;

                                account.storeAccountAuth(uuid,JSON.stringify(parsedSettings)).then(()=> {
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
    app.get('/api/v1/account/getAuth', (req, res) => {

        if (req.query.session) {
            session.validateSession(req.query.session.toString(), (isValid) => {
                if (isValid) {
                    session.reactivateSession(req.query.session);
                    session.getUserUUID(req.query.session.toString(), (uuid) => {

                        if (uuid) {
                            account.getAccountAuth(uuid, (settings) => {
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

};
