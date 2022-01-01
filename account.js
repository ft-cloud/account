import {v4 as uuidV4} from "uuid";
import crypto from "crypto";

import {session} from "sessionlib/session.js";

import util from "util";

import base32encode from 'base32-encode'

import {verifyTOTP} from "sessionlib/2fa.js";
import {transporter} from "./accountServer.js";

const hashingSecret = "LEDWAll";
const account = {


    checkAndCreateUser: function (name, email,password) {

        return new Promise((resolve => {


            const account = global.database.collection("account");
            const query = {name: {$regex: name, $options: 'i'}}

            account.findOne(query).then(result=> {
               if(result==null){
                   checkUserEmailExisting(email, password, name).then((returnValue) => {
                       resolve(returnValue);
                   });
               }else{
                   resolve('{\"error\":\"Username already exists\",\"errorcode\":\"004\"}');
               }
            });





        }));
    },

    login: function (nameOrEmail, password,TOTPToken,sessionTime) {

        return new Promise(resolve => {

            const pw_hash = crypto.createHmac('sha256', hashingSecret).update(password).digest('hex');
            const account = global.database.collection("account");
            account.findOne({$or: [{name: {$regex: nameOrEmail, $options: 'i'}},{email:{$regex: nameOrEmail, $options: 'i'}}],password: pw_hash}).then(user=>{
                if(user!==null) {
                    if(user.TOTPEnabled) {

                        if(TOTPToken!=null) {
                            this.verifyTOTP(user.uuid, TOTPToken, false).then(result => {
                                if (result.success === true) {

                                    session.startsession(user.uuid, sessionTime).then(session=>{
                                        if(session.success) {
                                            resolve(`{\"success\":true,\"tokenValid\": true,\"session\":\"${session.session}\"}`);

                                        }else{
                                            resolve(`{"error": "Account not verified", "errorcode": "020"}`);

                                        }
                                    });

                                } else {
                                    resolve(`{\"error\":\"Token invalid\",\"tokenValid\": false}`);

                                }
                            })

                        }else{
                            resolve(`{\"error\":\"TOTP required\",\"totp\": true}`);

                        }
                    }else{

                        session.startsession(user.uuid, sessionTime).then(session=>{
                            if(session.success) {
                                resolve(`{\"success\":true,\"session\":\"${session.session}\"}`);

                            }else{
                              resolve(`{"error": "Account not verified", "errorcode": "020"}`);

                            }
                        });


                    }

                } else {
                    resolve('{\"error\":\"email or password incorrect\",\"errorcode\":\"003\"}');


                }
            })


        })

    },
    isUserAdmin: function (uuid) {
        return new Promise((resolve, reject) => {
            const account = global.database.collection("account");
            account.findOne({uuid:uuid}).then(user=>{
                if(user!==null) {
                    resolve(user.admin)
                }
            })
        })



    },

    getAccountByUUID: function (uuid) {
        return new Promise((resolve, reject) => {
            const account = global.database.collection("account");
            account.findOne({uuid:uuid}).then(res=>{
                if(res!==null) {
                    const result = (({uuid,name,created_at,installedApps})=>({uuid,name,created_at,installedApps}))(res);
                    resolve(result)
                }
            })


        })

    },
    getAccountSettings: function (uuid, callback) {
        const account = global.database.collection("account");
        account.findOne({uuid:uuid}).then(res=>{
            if(res!==null&&res.settings!=null) {
                callback(res.settings);
            }else{
                callback({});
            }
        })



    },


    changeUsername: function(uuid, newUserName) {
     return new Promise((resolve,reject) => {
         const account = global.database.collection("account");
         account.updateOne({uuid:uuid},{$set:{name:newUserName}}).then(()=>{
             resolve();

         })

     })
    },

    //true if username is available
     checkUsernameExisting: function(name) {
     return new Promise((resolve) => {
         const account = global.database.collection("account");
         account.findOne({name: {$regex: name, $options: 'i'}}).then(res=> {
             if(res===null) {
                 resolve(true);
             }else{
                 resolve(false);
             }
         })

    })

},
    storeAccountSettings: function(uuid, settings) {

        return new Promise((resolve, reject) => {
            const account = global.database.collection("account");
            const filter = {
                uuid: uuid
            }
            const updateDoc = {
                $set: {
                    settings: settings
                }
            }
           account.updateOne(filter,updateDoc,{upsert: false}).then(()=>{
               resolve();
           });

        })
    },

    getAccountAuth: function (uuid, callback) {
        //TODO
        /*
        var sql = `SELECT auth
                   FROM account
                   WHERE uuid = ?;`;
        global.connection.query(sqlmodule.doStuff, [uuid.toString()], function (err, result) {

            if (result && result[0]) {
                callback(result[0].settings);

            } else {

                callback(undefined);

            }


        });

         */


    },
    storeAccountAuth: function (uuid, settings) {
        //TODO
        /*return new Promise((resolve, reject) => {
            const account = global.database.collection("account");
            const filter = {
                uuid: uuid
            }
            const

            const sql = `UPDATE account SET auth = ? WHERE uuid = ?`
            global.connection.query(sql,[settings.toString(),uuid], function (err, result) {
                if (err) throw err;
                resolve();
            });


        })

         */
    },

    setGoogleAccountDetails: function(uuid,googleAccountDetails) {
        return new Promise((resolve, reject)=> {
            const account = global.database.collection("account");
            console.log(googleAccountDetails);
            account.updateOne({uuid: uuid}, {$set: {googleDetails: googleAccountDetails}});
            resolve();
        });

    },
    setGoogleToken: function(uuid, googleid,googleDetails) {
        return new Promise((resolve, reject)=>{
            const account = global.database.collection("account");
            account.updateOne({uuid:uuid},{$set:{googleid:googleid,googleDetails:googleDetails}}).then(()=>{
                resolve();
            })
        })
    },




    enableTOTPAuth(uuid) {

        return new Promise((resolve => {
            const account = global.database.collection("account");
            account.findOne({uuid:uuid}).then(res=>{
                if(res!==null) {
                  if(res.TOTPEnabled===true) {
                      resolve({success:false,message:"TOTP is already enabled"});
                  }else{
                      const buffer = crypto.randomBytes(14);
                      const secret = base32encode(buffer, 'RFC4648',{padding:false});
                      //set secret but need to be verified
                      account.updateOne({uuid:uuid},{$set:{ TOTPSecret:secret}}).then(()=>{
                          resolve({success:true,secret:secret});
                      })
                  }

                }
            })


        }))

    },

    isTOTPEnabled(uuid) {
      return new Promise(resolve =>{
          const account = global.database.collection("account");
          account.findOne({uuid:uuid}).then(res=>{
              if(res!==null) {
                  if(res.TOTPEnabled===true) {
                      resolve(true);
                  }else{
                      resolve(false);
                  }
              }
          })

      })
    },

    verifyTOTP(uuid,code,enableItOnSuccess=false) {
        return new Promise((resolve,reject)=>{
            const account = global.database.collection("account");
            account.findOne({uuid:uuid}).then(res=>{
                if(res!==null) {
                if(res.TOTPSecret==null) {
                    resolve({success: false, message: "Account has no TOTP secret"});
                }else{
                    const secret = res.TOTPSecret;

                    if(verifyTOTP(code,secret)===true) {
                        if(enableItOnSuccess===true) {
                            account.updateOne({uuid:uuid},{$set:{TOTPEnabled:true}}).then(()=>{
                            })
                        }
                        resolve({success:true});
                    }else{
                        resolve({success:false,message:"Invalid TOTP code"});
                    }

                }
                }else{
                    resolve({success:false,message:"Account not found"});
                }
            })
        })
    },
    disableTOTP(uuid) {
        return new Promise((resolve, reject) => {
            const account = global.database.collection("account");
            account.updateOne({uuid:uuid},{$set:{TOTPEnabled:false}}).then(()=>{
                resolve();
            })
        })
    },
    verifyUserAccount(token) {
        return new Promise((resolve, reject) => {
            const account = global.database.collection("account");
            account.updateOne({tempVerifyToken:token},{$set:{verified:true},$unset:{tempVerifyToken: ""}}).then((result)=>{
                resolve(result.matchedCount>0);
            })
        })
    }
};



function checkUserEmailExisting(email,password,name) {

    return new Promise((resolve) => {
        const account = global.database.collection("account");
        account.findOne({email: {$regex: email, $options: 'i'}}).then((user) => {
            if(user===null) {
                createUser(password,name,email).then((returnValue) => {
                    resolve(returnValue)
                });

            }else{
                resolve('{\"error\":\"Email already exists\",\"errorcode\":\"005\"}')
            }
        })



    })

}


export default account;

function createUser(password,name,email) {
    return new Promise((resolve) => {

        const pw_hash = crypto.createHmac('sha256', hashingSecret).update(password.toString()).digest('hex');

        const userUUID = uuidV4();
        const account = global.database.collection("account");

        const uuidBuf = Buffer.from(uuidV4(), 'utf-8')
        const tempVerifyToken = uuidBuf.toString('base64');

        const user = {
            uuid: userUUID,
            email: email,
            password: pw_hash,
            name: name,
            verified: false,
            tempVerifyToken: tempVerifyToken
        }


        transporter.sendMail({
                from: '"Rekari Noreply" <noreply@rekari.de>', // sender address
                to: email, // list of receivers
                subject: "Rekari FT-Cloud Account E-Mail Verification", // Subject line
                text: "Aktivitate your Rekari FT-Cloud Account throw this link: https://api.arnold-tim.de/api/v1/account/verifyEmail?token="+tempVerifyToken, // plain text body
                html: `<h1>Rekari FT-Cloud Account E-Mail Verification</h1><p>To enable your account ${name} please click the following link: </p><a href="https://api.arnold-tim.de/api/v1/account/verifyEmail?token=${tempVerifyToken}">Enable Account</a>`, // html body

        }).then(()=>{
            account.insertOne(user);

            resolve(`{\"success\":\"Account creating done\"}`)
        });




    })

}
