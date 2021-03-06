import express from 'express';  
import format from 'pg-format';
import cryptoRandomString from 'crypto-random-string';
import dbLive from "./../../db/databaseLive.js"
import devDB from "./../../db/databaseLocalPG.js"
import mGun from 'mailgun-js'


const router = express.Router();
const db = process.env.live === "1" ? dbLive : devDB;
const URL = process.env.live === '1' ? process.env.deployURL : process.env.testURL

const API_KEY = process.env.API_KEY || 1;
const DOMAIN = process.env.DOMAIN_KEY || 1;
const mailgun = new mGun({ apiKey: API_KEY, domain: DOMAIN });

function emailIsValid(email) {
    return /\S+@\S+\.\S+/.test(email);
};

router.get("/accountData", (req, res, next) => {
  // thisRequest = req.query;
    if (req.session.login === true) {
        const accountDataQuery = `
        SELECT loginName, email, apiKey, webHook, ratelimit, apialias, widgetsetup 
        FROM users 
        WHERE id =$1`;
        const queryValues = [req.session.uID];
        const resultSet = {};
        console.log(accountDataQuery)
        db.query(accountDataQuery, queryValues, (err, rows) => {
        const result = rows.rows[0];
        // console.log(result)
        if (err) {
            console.log("/accountData ERROR:", err)
            res.status(400).json({message: "Could not retrieve user data"});
        } else {
            resultSet["userData"] = result;
            res.status(200).json(resultSet);
        }
        });
    } else {
        res.status(401).json({message: "Not logged in."})
    }
});

router.post("/accountData", (req, res) => {
    // console.log(req.body);
    if (req.session.login === true) {  
        
        if (req.body.field !== "email" && //NOT EMAIL
        ['loginname', 'ratelimit', 'webhook', 'apikey', 'exchangelist', 'email', 'apialias', 'widgetsetup',].includes(req.body.field)) {
            //NOT EMAIL
            console.log("updating account data");
            const updateField = req.body.field;
            const newValue = req.body.newValue;
            console.log(updateField, newValue)
            const updateQuery = format("UPDATE users SET %I = %L WHERE id=%L", updateField, newValue, req.session.uID);
            console.log("updateQuery", updateQuery);
            // let queryValues = [updateField, newValue, req.session.uID]
            db.query(updateQuery, (err) => {
                if (err) {
                    console.log("/accountData update query error: ", err)
                    res.status(400).json({message: `Failed to update ${updateField}`});
                } else {
                    res.status(200).json({
                        message: `${updateField} updated`,
                        data: newValue,
                    });
                }
        });
        } else if ( //EMAIL
            ['loginname', 'ratelimit', 'webhook', 'apikey', 'exchangelist', 'email', 'apialias', 'widgetsetup',].includes(req.body.field)
        ) {
        //EMAIL
            if (emailIsValid(req.body.newValue) === true) {
            console.log("new email address");

            let newValue = format(req.body.newValue);
            let queryString = cryptoRandomString({ length: 32 });
            let updateQuery = `INSERT INTO newEmail (userId, newEmail, queryString)
                VALUES (${req.session.uID}, '${newValue}', '${queryString}')
                `;
            
            // console.log(updateQuery);
            db.query(updateQuery, (err) => {
                if (err) {
                console.log('post /accountData update query error: ',err)
                res.status(400).json({message: `Problem updating email.`});
                } else {
                // console.log(res);
                const data = {
                    from: "Glenn Streetman <glennstreetman@gmail.com>",
                    to: newValue,
                    subject: "DO NOT REPLY: Verify Finnhub email change",
                    text: `Please visit the following link to verify the change to your finnhub email address: ${URL}/verifyChange?id=${queryString}`,
                };
                //send email
                if (req.body.newValue.indexOf('@test.com') === -1) {
                    mailgun.messages().send(data, (error) => {
                        if (error) {
                            console.log('post /accountData (req.body.newValue) error: ',err)
                            res.status(400).json({message: "Failed to send verification email"});
                        } else {
                            res.status(200).json({message: "Please check email to verify change."});
                        }
                    });
                } else {
                    res.status(200).json({message: "Please check email to verify change."});
                }
                }
            });
            } else {
                res.status(401).json({message: `email not valid`})
            }} else {
                res.status(401).json({message: `Error processing request Field: ${req.body.field}`})
            }
    } else {res.json({message: "Not logged in."})}
});

export default router;