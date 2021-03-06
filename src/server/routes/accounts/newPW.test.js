//setup express
import express from 'express';
import dotenv from 'dotenv'; 
import path from 'path';
import md5 from 'md5';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import request from 'supertest';
import sessionFileStore from 'session-file-store'; 
import db from '../../db/databaseLocalPG.js';
import bodyParser from 'body-parser';
import newPW from "./newPW.js";
import secretQuestion from "./../accountRegistration/secretQuestion.js";

const app = express();
dotenv.config()
app.use(express.static(path.join(__dirname, 'build')));
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json()); // support json encoded bodies
app.use(cookieParser());
const FileStore = sessionFileStore(session);
const fileStoreOptions = {};
app.use(
    session({
    store: new FileStore(fileStoreOptions),
    secret: process.env.session_secret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, sameSite: true },
    })
)

app.use('/', newPW) //route to be tested needs to be bound to the router.
app.use('/', secretQuestion) //needed fo all routes that require login.

beforeAll((done) => {
    const setupDB = `
    INSERT INTO users (
        loginname, email, password,	secretquestion,	
        secretanswer, apikey, webhook, confirmemaillink, 
        passwordconfirmed, exchangelist, defaultexchange, ratelimit,
        resetpasswordlink
    )
    VALUES (	
        'newPWTest', 'newPWTest@test.com', '735a2320bac0f32172023078b2d3ae56',	'hello',	
        '${md5('goodbye')}',	'',	'',	'',	
        true,	'US',	'US',	30,
        'testpasswordlink'
    )
    ON CONFLICT
    DO NOTHING
    ;
    UPDATE users 
    SET passwordconfirmed = true,  resetpasswordlink = 'testpasswordlink'
    WHERE loginname = 'newPWTest'
`   

    global.sessionStorage = {}
    db.connect(err => {
        if (err) {
            console.log('connection error', err.stack)
        } else {
            db.query(setupDB, (err) => {
                if (err) {
                    console.log("Problem setting up reset test.");
                } 
                done()
            }) 
        }
    })
})

afterAll((done)=>{
    db.end(done())
})

test("Fail to set new password get/newPW", (done) => {       
    request(app)
        .get(`/newPW?newPassword=testpw`)
        .expect({message: "Password not updated, restart process."})
        .expect(401, done)
    })

describe('Get login cookie:', ()=>{
    let cookieJar = ''
    beforeAll(function (done) {
        request(app)
            .get("/secretQuestion?loginText=goodbye&user=newPWTest")
            .then(res => {
                console.log("SECRET RESPONSE", res.statusCode)
                cookieJar = res.header['set-cookie']
                console.log(cookieJar)
                done()
            })
    })

    test("Set new password get/newPW", (done) => {       
        request(app)
            .get(`/newPW?newPassword=testpw`)
            .set('Cookie', cookieJar)
            .expect({message: "true"})
            .expect(200)
            .then(() => {
                request(app)
                    .get(`/newPW?newPassword=testpw`)
                    .set('Cookie', cookieJar)
                    .expect({message: "Password not updated, restart process."})
                    .expect(401, done)
            })
        })
    
})







