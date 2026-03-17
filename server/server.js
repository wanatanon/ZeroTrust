require("dotenv").config()
const express = require("express")
const client = require("prom-client")
const mongoose = require("mongoose")
const nodemailer = require("nodemailer")
const admin = require("firebase-admin")

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  })
})

function parseUserAgent(ua){

 if(!ua){
  return {browser:"Unknown", os:"Unknown", device:"Unknown"}
 }

 let browser="Unknown"
 let os="Unknown"
 let device="Desktop"

 if(ua.includes("Mobile")) device="Mobile"
 if(ua.includes("Tablet")) device="Tablet"

 if(ua.includes("Chrome")) browser="Chrome"
 else if(ua.includes("Firefox")) browser="Firefox"
 else if(ua.includes("Safari")) browser="Safari"

 if(ua.includes("Windows")) os="Windows"
 else if(ua.includes("Android")) os="Android"
 else if(ua.includes("iPhone")) os="iOS"
 else if(ua.includes("Mac")) os="MacOS"

 return {browser, os, device}
}

mongoose.connect("mongodb://127.0.0.1:27017/zerotrust")
.then(()=>{
 console.log("MongoDB Connected")
})
.catch((err)=>{
 console.log("MongoDB Error:",err)
})


const logSchema = new mongoose.Schema({

 type:String,
 ip:String,
 device:String,
 browser:String,
 os:String,
 userAgent:String,
 status:String,

 time:{
  type:Date,
  default:Date.now
 }

})

const Log = mongoose.model("Log",logSchema)

console.log("Zero Trust Metrics Server Started")

const app = express()
app.use(express.json())

app.get("/logs", async (req,res)=>{

 const logs = await Log.find(
  {},
  { _id:0, __v:0 }
 )
 .sort({time:-1})
 .limit(100)

 res.json(logs)

})

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "wanatanonreuharn@gmail.com",
    pass: "zcqe iyrc hxhl iywx"
  }
})

let otpStore = {}
// ---------------- CORS FIX ----------------
app.use((req,res,next)=>{
 res.setHeader("Access-Control-Allow-Origin","*")
 res.setHeader("Access-Control-Allow-Methods","GET,POST")
 res.setHeader("Access-Control-Allow-Headers","Content-Type")
 next()
})

// ---------------- Prometheus ----------------

const register = new client.Registry()
client.collectDefaultMetrics({ register })

// ---------------- Metrics ----------------

const httpRequests = new client.Counter({
 name:"http_requests_total",
 help:"Total HTTP Requests",
 registers:[register]
})

const loginAttempts = new client.Counter({
 name:"login_attempts_total",
 help:"Total Login Attempts",
 registers:[register]
})

const loginSuccess = new client.Counter({
 name:"login_success_total",
 help:"Total Successful Logins",
 registers:[register]
})

const loginFail = new client.Counter({
 name:"login_fail_total",
 help:"Total Failed Logins",
 registers:[register]
})

const attackDetected = new client.Counter({
 name:"attack_detected_total",
 help:"Total Detected Attacks",
 registers:[register]
})

const sqlAttack = new client.Counter({
 name:"attack_sql_injection_total",
 help:"Total SQL Injection Attacks",
 registers:[register]
})

const xssAttack = new client.Counter({
 name:"attack_xss_total",
 help:"Total XSS Attacks",
 registers:[register]
})

const bruteAttack = new client.Counter({
 name:"attack_bruteforce_total",
 help:"Total Brute Force Attacks",
 registers:[register]
})

const otpFail = new client.Counter({
 name:"otp_fail_total",
 help:"Total OTP Fail",
 registers:[register]
})

const otpSuccess = new client.Counter({
 name:"otp_success_total",
 help:"Total OTP Success",
 registers:[register]
})

// ---------------- Count Requests ----------------

app.use((req,res,next)=>{
 httpRequests.inc()
 next()
})

// ---------------- Routes ----------------

app.post("/send-otp", async (req, res) => {

 const { token } = req.body

 if(!token){
  return res.status(401).send("No token")
 }

 try{

  // ✅ verify token
  const decoded = await admin.auth().verifyIdToken(token)
  const email = decoded.email

  // ✅ สร้าง OTP ใหม่ทุกครั้ง
  const otp = Math.floor(100000 + Math.random() * 900000)

  // 🔥 เก็บแบบมี expire (สำคัญมาก)
  otpStore[email] = {
   otp: otp,
   expire: Date.now() + 60000
  }

  console.log("OTP:", otp)

  // 📧 ส่ง email (ถ้าจะใช้จริงค่อยเปิด)
  
  await transporter.sendMail({
   from: "wanatanonreuharn@gmail.com",
   to: email,
   subject: "Your OTP Code",
   text: "Your OTP is: " + otp
  })


  // 🔥 log ลง Mongo (อยู่ใน async แล้ว)
  await Log.create({
   type:"MFA",
   ip:req.ip,
   device:"unknown",
   browser:"unknown",
   os:"unknown",
   userAgent:req.headers["user-agent"],
   status:"otp_sent"
  })

  res.send("OTP sent")

 }catch(err){
  console.log(err)
  res.status(401).send("Unauthorized")
 }
})

app.post("/verify-otp", async (req,res)=>{

  const { email, otp } = req.body
  const data = otpStore[email]

  if(!data) return res.status(400).send("No OTP")

  if(Date.now() > data.expire){
    delete otpStore[email]
    return res.status(400).send("Expired")
  }

  if(data.otp == otp){

    delete otpStore[email]

    await Log.create({
      type:"MFA",
      ip:req.ip,
      device:"unknown",
      browser:"unknown",
      os:"unknown",
      userAgent:req.headers["user-agent"],
      status:"success"
    })

    return res.send("OK")
  }

  res.status(400).send("Wrong OTP")
})

app.get("/",(req,res)=>{
 res.send("Zero Trust Metrics Server Running")
})

app.get("/login", async (req,res)=>{

 loginAttempts.inc()

 let ip =
 req.headers["x-forwarded-for"] ||
 req.socket.remoteAddress||
 req.ip

if(ip === "::1"){
 ip = "127.0.0.1"
}

 const ua = req.headers["user-agent"]

 const info = parseUserAgent(ua)

 await Log.create({

  type:"login",
  ip:ip,
  device:info.device,
  browser:info.browser,
  os:info.os,
  userAgent:ua,
  status:"attempt"

 })

 res.send("login attempt recorded")
})

app.get("/success", async (req,res)=>{

 loginSuccess.inc()

 let ip =
 req.headers["x-forwarded-for"] ||
 req.socket.remoteAddress||
 req.ip

if(ip === "::1"){
 ip = "127.0.0.1"
}

 const ua = req.headers["user-agent"]

 const info = parseUserAgent(ua)

 await Log.create({

  type:"login",
  ip:ip,
  device:info.device,
  browser:info.browser,
  os:info.os,
  userAgent:ua,
  status:"success"

 })

 res.send("login success recorded")
})

app.get("/fail", async (req,res)=>{

 loginFail.inc()

 let ip =
 req.headers["x-forwarded-for"] ||
 req.socket.remoteAddress||
 req.ip

if(ip === "::1"){
 ip = "127.0.0.1"
}

 const ua = req.headers["user-agent"]

 const info = parseUserAgent(ua)

 await Log.create({

  type:"login",
  ip:ip,
  device:info.device,
  browser:info.browser,
  os:info.os,
  userAgent:ua,
  status:"fail"

 })

 res.send("login fail recorded")
})

app.get("/attack", async (req,res)=>{

 attackDetected.inc()

 let ip =
 req.headers["x-forwarded-for"] ||
 req.socket.remoteAddress||
 req.ip

if(ip === "::1"){
 ip = "127.0.0.1"
}

 const ua = req.headers["user-agent"]

 const info = parseUserAgent(ua)

 await Log.create({

  type:"attack",
  ip:ip,
  device:info.device,
  browser:info.browser,
  os:info.os,
  userAgent:ua,
  status:"detected"

 })

 res.send("attack detected")
})

app.get("/attack/sql", async (req,res)=>{

 attackDetected.inc()   
 sqlAttack.inc()

 let ip =
 req.headers["x-forwarded-for"] ||
 req.socket.remoteAddress||
 req.ip

if(ip === "::1"){
 ip = "127.0.0.1"
}

 const ua = req.headers["user-agent"]

 const info = parseUserAgent(ua)

 await Log.create({

  type:"SQL Injection",
  ip:ip,
  device:info.device,
  browser:info.browser,
  os:info.os,
  userAgent:ua,
  status:"detected"

 })

 res.send("sql injection recorded")

})

app.get("/attack/xss", async (req,res)=>{

 attackDetected.inc()   
 xssAttack.inc()

 let ip =
 req.headers["x-forwarded-for"] ||
 req.socket.remoteAddress||
 req.ip

if(ip === "::1"){
 ip = "127.0.0.1"
}

 const ua = req.headers["user-agent"]

 const info = parseUserAgent(ua)

 await Log.create({

  type:"XSS",
  ip:ip,
  device:info.device,
  browser:info.browser,
  os:info.os,
  userAgent:ua,
  status:"detected"

 })

 res.send("xss attack recorded")
})

app.get("/attack/brute", async (req,res)=>{
 attackDetected.inc()
 bruteAttack.inc()

 let ip =
 req.headers["x-forwarded-for"] ||
 req.socket.remoteAddress||
 req.ip

if(ip === "::1"){
 ip = "127.0.0.1"
}

 const ua = req.headers["user-agent"]

 const info = parseUserAgent(ua)

 await Log.create({

 type:"Brute Force",
 ip:ip,
 device:info.device,
 browser:info.browser,
 os:info.os,
 userAgent:ua,
 status:"detected"

 })

 res.send("brute force recorded")
})


// ---------------- Prometheus ----------------

app.get("/metrics", async (req,res)=>{

 res.set("Content-Type", register.contentType)

 res.end(await register.metrics())

})

// ---------------- Server ----------------

app.listen(4000,()=>{
 console.log("Metrics Server running on port 4000")
})


