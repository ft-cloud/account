var uuid = require('uuid');
const crypto = require('crypto');
const hashingSecret = "LEDWAll";
const session = require('sessionlib/session');


var account = {


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

    login: function (nameOrEmail, password,sessionTime) {

        return new Promise(resolve => {

            const pw_hash = crypto.createHmac('sha256', hashingSecret).update(password).digest('hex');
            const account = global.database.collection("account");
            account.findOne({$or: [{name: {$regex: nameOrEmail, $options: 'i'}},{email:{$regex: nameOrEmail, $options: 'i'}}],password: pw_hash}).then(user=>{
                if(user!==null) {

                    resolve(`{\"success\":\"loged in\",\"session\":\"${session.startsession(user.uuid,sessionTime)}\"}`);

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


    changeUsername(uuid, newUserName) {
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
    storeAccountSettings(uuid, settings) {

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
        global.connection.query(sql, [uuid.toString()], function (err, result) {

            if (result && result[0]) {
                callback(result[0].settings);

            } else {

                callback(undefined);

            }


        });

         */


    },
    storeAccountAuth(uuid, settings) {
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
    }


};

module.exports = account;


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

function createUser(password,name,email) {
    return new Promise((resolve) => {

        const pw_hash = crypto.createHmac('sha256', hashingSecret).update(password.toString()).digest('hex');

        const userUUID = uuid.v4();
        const account = global.database.collection("account");
        const user = {
            uuid: userUUID,
            email: email,
            password: pw_hash,
            name: name
        }

        account.insertOne(user);

        resolve(`{\"success\":\"Account creating done\",\"session\":\"${session.startsession(user.uuid)}\"}`)

    })

}
