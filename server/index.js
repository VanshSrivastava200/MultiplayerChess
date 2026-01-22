import express from "express";
import { Server } from "socket.io";
import { createServer } from "node:http";
import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";
import Game from "./models/Game.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import Cryptr from "cryptr";

const cryptr = new Cryptr("4f5v9e4v9e9gte94b9");
const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const PORT = process.env.PORT;
app.use(cookieParser());

//moddleware
app.use(express.json());
app.use(
  cors({
    origin: "https://vchessplay.netlify.app/",
    credentials: true,
  })
);

var currentuser;
//login check
const isLoggedIn = async (req, res, next) => {
  if (req.cookies?.token) {
    try {
      currentuser = cryptr.decrypt(req.cookies.token);
      console.log("currentuser -> ", currentuser);
      const isUserExist = await User.findOne({ username: currentuser });
      console.log("vv", isUserExist);
      if (isUserExist) next();
    } catch (error) {
      console.log("Invalid token", error);
      res.json("Invalid token");
    }
  } else {
    console.log("Please Login first");
    res.json("Please Login first");
  }
};

//database
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("DB Connected"))
  .catch((err) => {
    console.log("Unable to connect to db");
  });

//routes

//register
app.post("/register", async (req, res) => {
  const { name, username, email, password, country } = req.body;
  const newUser = new User({
    name,
    username,
    email,
    password,
    country,
    rating:600,
  });

  try {
    User.findOne({ username }).then((founduser) => {
      if (founduser) {
        res.json({ check: false, message: "User already exists" });
        return;
      }
    });
  } catch (err) {
    console.log(err);
    res.json({ check: false, message: "Failed to register" });
    return;
  }
  try {
    User.findOne({ email }).then((founduser) => {
      if (founduser) {
        res.json({ check: false, message: "User already exists" });
        return;
      }
    });
  } catch (err) {
    console.log(err);
    res.json({ check: false, message: "Failed to register" });
    return;
  }

  try {
    await newUser.save();
    console.log("User registered\n" + newUser);
    res.json({ check: true, message: "User registered" });
  } catch (err) {
    console.log(err);
    res.json({ check: false, message: "Failed to register" });
  }
});

//login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  try {
    User.findOne({ username }).then((founduser) => {
      if (founduser) {
        if (founduser.password == password) {
          console.log("Session after login:", req.session);
          console.log("logged in successfully");
          const userhash = cryptr.encrypt(username);

          res.cookie("token", userhash, {
            httpOnly: true,
            secure: true, // set true when using HTTPS
            sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000, // 1 day
          });

          res.json({ check: true, message: "Logged in successfully" });
        } else {
          console.log("Wrong password");
          res.json({ check: false, message: "Wrong password" });
        }
      } else {
        console.log("User does not exist");
        res.json({ check: false, message: "User does not exist" });
      }
    });
  } catch (err) {
    console.log(err);
    res.json({ check: false, message: "Failed to login" });
  }
});

//startgame
app.post("/startgame", isLoggedIn, (req, res) => {
  res.json({ check: true, user: currentuser });
});

app.post('/getdata',async (req,res)=>{
  let accdetails;
  let games;
  const uid=req.body.uid;
  console.log(uid)
  try{
    await User.findOne({username:uid},{password:0,email:0}).then((founduser)=>{
    accdetails=founduser;
  })
  await Game.find({$or:[{username1:uid},{username2:uid}]}).then((foundgames)=>{
    games=foundgames;
  })
  console.log({accdetails,games})
  res.send({accdetails,games})
  }catch(err){
    console.log(err)
  }
})

app.post('/getrating',async(req,res)=>{
  const id = req.body.id;
  try{
    User.findOne({username:id}).then((founduser)=>{
      if(founduser){
        res.json({rating:founduser.rating})
        console.log(founduser.rating)
      }
      else{
        console.log("user does not exist")
      }
    })
  }catch(error){
    console.log("Failed to fetch rating");
  }
})

let waitinguser = null;
let user1;
let user2;
//socket connect
let roomId;
io.on("connection", (socket) => {
  console.log(`User connected ${socket.id}`);
  socket.username = currentuser;
  if (!waitinguser) {
    waitinguser = socket;
    socket.emit("waiting", true);
    console.log("Waiting user joined " + socket.id);
    socket.emit("waiting", "Waiting for another user to join");
  } else if (waitinguser && waitinguser.username != socket.username) {
    roomId = `${waitinguser.id}-${socket.id}`;
    socket.join(roomId);
    socket.emit("waiting", false);
    waitinguser.join(roomId);
    waitinguser.emit("paired", { roomId, p: "W", opp: socket.username });
    socket.emit("paired", { roomId, p: "B", opp: waitinguser.username });
    console.log(`Paired users in ${roomId}`);
    user1 = waitinguser.username;
    user2 = socket.username;
    waitinguser = null;
  }
  //disconnet
  socket.on("disconnect", () => {
    console.log("User disconnected " + socket.id);
    if (waitinguser && waitinguser.id == socket.id) {
      waitinguser = null;
    }
  });
  //move
  socket.on("setMove", (move) => {
    const { sourceSquare, targetSquare } = move;
    socket.to(roomId).emit("getMove", { sourceSquare, targetSquare });
  });
  //message
  socket.on("setMessage", (message) => {
    socket.to(roomId).emit("getMessage", message);
  });

  //savegame
  socket.on("over", async ({ gamestatus }) => {
    let num;
    console.log(gamestatus)
    if (gamestatus === user1) num = 1;
    else if (gamestatus === user2) num = 2;
    else num = 3;

    const newGame = new Game({
      username1: user1,
      username2: user2,
      status: num,
    });

    try {
      await newGame.save();
      console.log("Game saved\n" + newGame);
    } catch (err) {
      console.log(err);
    }
    try{
      if(num==1){
        await User.updateOne(
        {username:user1},
        {$inc:{rating:8}})
        await User.updateOne(
        {username:user2},
        {$inc:{rating:-8}})
      }
      else if(num==2){
        await User.updateOne(
        {username:user1},
        {$inc:{rating:-8}})
        await User.updateOne(
        {username:user2},
        {$inc:{rating:8}})
      }
    }catch(err){
      console.log(err)
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
