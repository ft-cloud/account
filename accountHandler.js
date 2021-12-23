import account from "./account.js";

import {session} from "sessionlib/session.js";

import {app} from "./accountServer.js";

import axios from "axios";

import qrcode from "qrcode";

export function initAccountPaths() {
//TODO add info function without session instead uuid of account

    app.get('/api/v1/account/info', (req, res) => {

        if (req.query.session != null) {
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

        if (req.query.uuid != null) {

            account.isUserAdmin(req.query.uuid).then((admin) => {
                res.send(JSON.stringify({isAdmin: admin}));
            });


        } else {
            res.send('{\"error\":\"No valid inputs!\",\"errorcode\":\"002\"}');
        }

    });
    app.get('/api/v1/account/amIAdmin', (req, res) => {


        if (req.query.session != null) {

            session.getUserUUID(req.query.session, (uuid) => {
                if (uuid) {

                    account.isUserAdmin(uuid).then((admin) => {
                        res.send(JSON.stringify({isAdmin: admin}));
                    });

                } else {
                    res.send('{\"error\":\"No valid account!\",\"errorcode\":\"006\"}');
                }
            });


        } else {
            res.send('{\"error\":\"No valid inputs!\",\"errorcode\":\"002\"}');
        }

    });

    app.get('/api/v1/account/getSettings', (req, res) => {

        if (req.query.session != null) {
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
    app.post("/api/v1/account/changeSetting", (req, res) => {
        if (req.body.session != null && req.body.key != null && req.body.newValue != null) {
            session.validateSession(req.body.session.toString(), (isValid) => {
                if (isValid) {
                    session.reactivateSession(req.body.session);
                    session.getUserUUID(req.body.session.toString(), (uuid) => {
                        if (uuid) {
                            account.getAccountSettings(uuid, settings => {
                                settings[req.body.key] = req.body.newValue;

                                account.storeAccountSettings(uuid, settings).then(() => {
                                    res.json({
                                        success: true
                                    });
                                });
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


    app.post("/api/v1/account/changeUsername", (req, res) => {

        if (req.body.session != null && req.body.newUsername != null) {
            if (req.body.newUsername.toString().trim().length >= 3 && req.body.newUsername.toString().length <= 25) {
                const regex = /[^A-Za-z0-9\s]/;
                if (!regex.test(req.body.newUsername.toString())) {
                    session.validateSession(req.body.session.toString(), (isValid) => {
                        if (isValid) {
                            session.reactivateSession(req.body.session);
                            session.getUserUUID(req.body.session.toString(), (uuid) => {
                                if (uuid) {
                                    account.checkUsernameExisting(req.body.newUsername.toString()).then(available => {
                                        if (available) {
                                            account.changeUsername(uuid, req.body.newUsername.toString()).then(() => {
                                                res.json({
                                                    success: true
                                                });
                                            });
                                        } else {
                                            res.send('{\"error\":\"Username already exists\",\"errorcode\":\"004\"}');
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
                    res.send('{\"error\":\"Invalid Characters\",\"errorcode\":\"013\"}');
                }

            } else {
                res.send('{\"error\":\"Username must contain at least 3 Characters\",\"errorcode\":\"014\"}');
            }
        } else {
            res.send('{\"error\":\"No valid inputs!\",\"errorcode\":\"002\"}');
        }
    });


    app.get("/api/v1/account/getTOTPSecret", (req, res) => {

        if (req.query.session != null) {

            session.validateSession(req.query.session.toString(), (isValid) => {
                if (isValid) {
                    session.reactivateSession(req.query.session);
                    session.getUserUUID(req.query.session.toString(), (uuid) => {
                        if (uuid) {


                            account.enableTOTPAuth(uuid).then((result) => {

                                if (result.success) {
                                    account.getAccountByUUID(uuid).then(accountInfo => {
                                        const issuer = 'FT-Cloud';
                                        const algorithm = 'SHA1';
                                        const digits = '6';
                                        const period = '30';
                                        const otpType = 'totp';
                                        const configUri = `otpauth://${otpType}/${issuer}:${accountInfo.name}?algorithm=${algorithm}&digits=${digits}&period=${period}&issuer=${issuer}&secret=${result.secret}`;

                                        res.setHeader('Content-Type', 'image/png');

                                        qrcode.toFileStream(res, configUri);
                                    });

                                } else {
                                    res.status(400).json({error: "TOTP already enabled", errorcode: "018"});
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

    app.post("/api/v1/account/enableTOTPAuth", (req, res) => {

        if (req.body.session != null && req.body.verifyToken != null) {

            session.validateSession(req.body.session.toString(), (isValid) => {
                if (isValid) {
                    session.reactivateSession(req.body.session);
                    session.getUserUUID(req.body.session.toString(), (uuid) => {
                        if (uuid) {

                            account.verifyTOTP(uuid, req.body.verifyToken.toString(), true).then((result) => {
                                if (result.success) {
                                    res.status(200).json({success: true, message: "TOTP enabled"});
                                } else {
                                    res.status(400).json({error: "Invalid Token", errorcode: "019"});
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

    app.get("/api/v1/account/verifyTOTP", (req, res) => {
        //generate a session if token is valid and account has 2fa enabled (somehow)
        if (req.body.session != null && req.body.token != null) {

            session.validateSession(req.body.session.toString(), (isValid) => {
                if (isValid) {
                    session.reactivateSession(req.body.session);
                    session.getUserUUID(req.body.session.toString(), (uuid) => {
                        if (uuid) {


                            account.verifyTOTP(uuid, req.body.token.toString()).then((result) => {
                                if (result.success) {
                                    //todo generate session out of code
                                    res.status(200).json({success: true, message: "TOTP valid"});
                                } else {
                                    res.status(400).json({error: "Invalid Token", errorcode: "019"});
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

    app.get("/api/v1/account/isTOTPEnabled", (req, res) => {
        if (req.query.session != null) {

            session.validateSession(req.query.session.toString(), (isValid) => {
                if (isValid) {
                    session.reactivateSession(req.query.session);
                    session.getUserUUID(req.query.session.toString(), (uuid) => {
                        if (uuid) {


                            account.isTOTPEnabled(uuid).then((result) => {
                                if (result) {
                                    res.status(200).json({success: true, enabled: true, message: "TOTP enabled"});
                                } else {
                                    res.status(200).json({success: true, enabled: false, message: "TOTP disabled"});
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

    app.get("/api/v1/account/disableTOTP", (req, res) => {
        if (req.query.session != null) {

            session.validateSession(req.query.session.toString(), (isValid) => {
                if (isValid) {
                    session.reactivateSession(req.query.session);
                    session.getUserUUID(req.query.session.toString(), (uuid) => {
                        if (uuid) {

                            account.disableTOTP(uuid).then(() => {
                                res.status(200).json({success: true, message: "TOTP disabled"});
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

}
