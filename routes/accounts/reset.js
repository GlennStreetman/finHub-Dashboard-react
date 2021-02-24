const express = require('express');
const router =  express.Router();
const format = require('pg-format');
const db = process.env.live === '1' ? 
    require("../../db/databaseLive.js") :  
    require("../../db/databaseLocalPG.js") ;

//user visits reset link, from their email, and get redirected to reset password screen in app.
router.get("/reset", (req, res, next) => {
    // console.log(req.query)
    let verifyID = format('%L', req.query['id'])
    req.session.userName = req.query['users']
    let verifyUpdate = `
    UPDATE users
    SET passwordconfirmed = true
    WHERE resetpasswordlink = ${verifyID} AND loginname = '${req.query['users']}'
    RETURNING *
    `
    // console.log(verifyUpdate)
    db.query(verifyUpdate, (err, rows) => {
    if (err) {
        res.status(400).json({message: "Error during password reset process."});
    } else if (rows.rowCount === 1) {
        res.status(302).redirect(`/?reset=1&users=${rows.rows[0].loginname}`)
    } else {
        res.status(302).redirect(`/?message=Problem%validating%reset%link,%please%restart%process.`)
    }
    })
});

module.exports = router;