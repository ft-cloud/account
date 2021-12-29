import express from "express";

import cookieParser from "cookie-parser";

import cors from "cors";

import {MongoClient} from "mongodb";

import {initAccountPaths} from "./accountHandler.js";

import {initSessionPaths} from "./sessionHandler.js";
import nodemailer from "nodemailer";

export const app = express();

const uri = `mongodb://root:${process.env.MYSQL_ROOT_PASSWORD}@mongo:27017/?authSource=admin&readPreference=primary&directConnection=true&ssl=false`
const client = new MongoClient(uri);

client.connect().then(()=> {
    global.database = client.db("cloud");

})
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser())
app.disable('x-powered-by');

export const transporter = new nodemailer.createTransport({
    host: "smtp.ionos.de",
    port: 465,
    secure: true,
    auth: {
        user: "noreply@rekari.de",
        pass: process.env.EMAIL_NOREPLY_PASSWORD
    }
})



app.use(cors());

app.post("/api/v1/account/sendContact",(req,res)=> {
        //send mail through nodemailer to info@rekari.de with the content of the request body
        if (req.body.email && req.body.message && req.body.name) {
            const mailOptions = {
                from: '"Rekari Noreply" <noreply@rekari.de>', // sender address
                to: "info@rekari.de",
                subject: "Rekari - Kontaktformular",
                text: req.body.message,
                html: `<p>${req.body.message}</p><div>From ${req.body.email}</div><div>Name ${req.body.name}</div>`
            }
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                    res.status(200).send({"success": false});
                } else {
                    console.log("Email sent: " + info.response);
                    res.status(200).send({"success": true});
                }
            });

        }else{
            res.status(400).send({"success": false});
        }

    }
)

app.get("/api/v1/account",(req, res) => {
    res.send(JSON.stringify({microService:"Account"}))
})
app.get("/api/v1/auth",(req, res) => {
    res.send(JSON.stringify({microService:"Account"}))
})

initAccountPaths();

initSessionPaths();

app.listen(3000, () => {
    console.log(`Account app listening at http://localhost:3000`);

});



app.use(function (err,req,res,next){
    if (res.headersSent) {
        return next(err);
    }
    console.error(err);
    res.status(500);
    res.send('Something went wrong')
})


app.use(function (req, res) {
    res.status(404).send('Something went wrong! Microservice: Account');
});


