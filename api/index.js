import dotenv from "dotenv";
import express from "express";
import mongoose, { connections } from "mongoose";
import jwt from "jsonwebtoken"
import cors from "cors"
import { User } from "./Models/user.model.js";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs"
import { WebSocketServer } from "ws";
import { Message } from "./Models/message.model.js";

dotenv.config()
mongoose.connect(process.env.MONGO_URL)

const JWTsecret = process.env.JWT_SECRET
const bcryptSalt = bcrypt.genSaltSync(10)

const app = express()

app.use(express.json())
app.use(cookieParser())

app.use(cors({
    credentials: true,
    origin: "http://localhost:5173",
    // origin: process.env.CLIENT_URL
}))

async function getUserDataFromRequest(req) {
    return new Promise((resolve, reject) => {
      const token = req.cookies?.token;
      if (token) {
        jwt.verify(token, JWTsecret, {}, (err, userData) => {
          if (err) throw err;
          resolve(userData);
        });
      } else {
        reject('no token');
      }
    });  
}

app.get("/test",(req,res)=>{
    res.json("test ok")
})

app.get('/messages/:userId', async (req,res) => {
    const {userId} = req.params;
    const userData = await getUserDataFromRequest(req);
    const ourUserId = userData.userId;
    const messages = await Message.find({
      sender:{$in:[userId,ourUserId]},
      recipient:{$in:[userId,ourUserId]},
    }).sort({createdAt: 1});
    res.json(messages);
});

app.get("/people", async (req,res)=>{
    const users = await User.find({}, {'_id': 1, username: 1})
    res.json(users)
})

app.post("/register", async (req,res)=>{
    try {
        const {username, password} = req.body
        const hashedPassword = bcrypt.hashSync(password, bcryptSalt)
        const user = await User.create({username, password: hashedPassword})
        jwt.sign({userId: user._id, username}, JWTsecret, {}, (err,token) => {
            if(err) throw err;
            res.cookie('token', token).status(201).json({
                id: user._id
            })
        })
    } catch (error) {
        if(error) throw error
        res.status(500).json('error');
        
    }
})


app.get("/profile", (req,res) => {
    const token = req.cookies?.token
    if(token){
        jwt.verify(token, JWTsecret, {}, (err, userData) => {
            if(err) throw err
            res.json(userData)
        })
    } else{
        res.status(201).json("no token")
    }
    
})


app.post('/login', async (req,res) => {
    const {username, password} = req.body;
    const foundUser = await User.findOne({username});
    if (foundUser) {
      const passOk = bcrypt.compareSync(password, foundUser.password);
      if (passOk) {
        jwt.sign({userId:foundUser._id,username}, JWTsecret, {}, (err, token) => {
          res.cookie('token', token, {sameSite:'none', secure:true}).json({
            id: foundUser._id,
          });
        });
      }
    }
});


app.post('/logout', (req,res) => {
    res.cookie('token', '', {sameSite:'none', secure:true}).json('ok')
})


const server = app.listen(4040)
const wss = new WebSocketServer({server})
wss.on('connection', (connection, req)=>{
    console.log("connected")

    const cookie = req.headers.cookie
    if(cookie){
        const cookieString = cookie.split(';').find(str => str.startsWith('token='))
        if(cookieString){
            const token = cookieString.split('=')[1]
            if(token){
                jwt.verify(token, JWTsecret, {}, (err, user) => {
                    const {username, userId} = user
                    connection.userId = userId
                    connection.username = username
                })
            }
        }
    }


    connection.on('message', async (message) => {
        const messageData = JSON.parse(message.toString())
        const { recipient, text } = messageData.message
        if( recipient && text ){
            const messageDoc = await Message.create({
                sender: connection.userId,
                recipient,
                text
            });

            [...wss.clients]
            .filter( c => c.userId === recipient )
            .forEach( c => c.send(JSON.stringify({
                text,
                sender: connection.userId,
                recipient, 
                _id: messageDoc._id
            })))
        }
    });


    [...wss.clients].forEach(client => {
        client.send(JSON.stringify({
            online: [...wss.clients].map(c => (
                {
                    userId: c.userId,
                    username: c.username
                }
            ))
        }))
    })
})