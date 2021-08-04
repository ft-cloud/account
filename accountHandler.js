var account = require('./account');
var session = require('./session');

const {app} = require('./accountServer.js');


module.exports.init = function initAccountPaths() {


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

    app.get('/api/v1/account/isUserAdmin', (req, res) => {

        if (req.query.uuid) {


            account.isUserAdmin(req.query.uuid).then((admin) => {
                res.send(JSON.stringify({isAdmin: admin}));
            });
                 

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


};
