const express = require('express');
const app = express();
module.exports.app = app;

const cors = require('cors');
const mysql = require('mysql');


const accountHandler = require("./accountHandler");
const sessionHandler = require("./sessionHandler");


global.connection = mysql.createConnection({
    host: 'database',
    user: 'root',
    password: process.env.MYSQL_ROOT_PASSWORD,
    database: "cloud",
    connectTimeout: 5000
});

app.use(express.json());
app.use(express.urlencoded({extended: true}));



global.connection.connect();


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



app.use(function (req, res) {
    res.status(404).send('Something went wrong! Microservice: Account');
});
