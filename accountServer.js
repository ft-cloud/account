const express = require('express');
const app = express();
module.exports.app = app;

const cors = require('cors');
const { MongoClient } = require("mongodb");
const uri = `mongodb://root:${process.env.MYSQL_ROOT_PASSWORD}@mongo:27017/?authSource=admin&readPreference=primary&directConnection=true&ssl=false`
const client = new MongoClient(uri);

client.connect().then(()=> {
    global.database = client.db("cloud");


})

const accountHandler = require("./accountHandler");
const sessionHandler = require("./sessionHandler");
const account = require("./account");




app.use(express.json());
app.use(express.urlencoded({extended: true}));





app.use(cors());

app.get("/api/v1/account",(req, res) => {
    res.send(JSON.stringify({microService:"Account"}))
})
app.get("/api/v1/auth",(req, res) => {
    res.send(JSON.stringify({microService:"Account"}))
})


accountHandler.init();
sessionHandler.init();

app.listen(3000, () => {
    console.log(`Account app listening at http://localhost:3000`);

});

app.use(function (err,req,res,next){
    if (res.headersSent) {
        return next(err);
    }
    res.status(500);
    res.send('Something went wrong')
})


app.use(function (req, res) {
    res.status(404).send('Something went wrong! Microservice: Account');
});
