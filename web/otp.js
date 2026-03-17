// ---------------- Metric ----------------
function sendMetric(type){
 fetch("http://localhost:4000/" + type,{
  method:"GET",
  mode:"cors",
  keepalive:true
 }).catch(()=>{})
}

// ---------------- State ----------------
let otpFailCount = 0
let resendLock = false
let otpTimer = null

// ---------------- Countdown ----------------
function startOTPCountdown(expireTime){

 const el = document.getElementById("otp-timer")

 if(otpTimer){
  clearInterval(otpTimer)
 }

 otpTimer = setInterval(()=>{

  const remain = expireTime - Date.now()

  if(remain <= 0){
   clearInterval(otpTimer)

   el.innerHTML = "OTP expired"
   sendMetric("otp/expired")

   // ❌ หมดแล้วลบ expire (ต้อง resend เท่านั้น)
   sessionStorage.removeItem("otp_expire")

   return
  }

  const sec = Math.ceil(remain/1000)
  el.innerHTML = "OTP expires in " + sec + " sec"

 },1000)
}

// ---------------- Init OTP ----------------
function initOTP(){

 let expire = sessionStorage.getItem("otp_expire")

 // ❌ ถ้ายังไม่มี → แสดง expired (ไม่ auto reset)
 if(!expire){
  document.getElementById("otp-timer").innerHTML = "OTP expired"
  return
 }

 startOTPCountdown(parseInt(expire))
}

// ---------------- Verify OTP ----------------
async function verifyOTP(){

 const otp = document.getElementById("otp").value
 const email = sessionStorage.getItem("otp_email")

 const expire = parseInt(sessionStorage.getItem("otp_expire"))

 if(!expire){
  alert("OTP expired. Please resend.")
  return
 }

 if(Date.now() > expire){
  alert("OTP expired")
  sendMetric("otp/expired")
  return
 }

 const res = await fetch("http://localhost:4000/verify-otp",{
  method:"POST",
  headers:{ "Content-Type":"application/json" },
  body: JSON.stringify({ email, otp })
 })

 if(res.ok){

  sendMetric("success")

  const role = sessionStorage.getItem("user_role")

  if(role=="HR"){
   window.location="hr/hr.html"
  }else{
   window.location="admin/admin.html"
  }

 }else{

  otpFailCount++
  sendMetric("otp/fail")

  alert("OTP incorrect (" + otpFailCount + "/3)")

  if(otpFailCount >= 3){

   sendMetric("attack")
   sendMetric("attack/otp_brute")

   localStorage.setItem("lockTime", Date.now() + 10000)

   alert("Too many attempts!")

   window.location = "index.html"
  }
 }
}

// ---------------- Resend OTP ----------------
async function resendOTP(){

 if(resendLock){
  alert("Wait 10 seconds before resend")
  return
 }

 const btn = document.getElementById("resendBtn")
 btn.disabled = true
 resendLock = true

 const token = sessionStorage.getItem("firebase_token")

 if(!token){
  alert("Session expired, please login again")
  window.location = "index.html"
  return
 }

 try{

  const res = await fetch("http://localhost:4000/send-otp",{
   method:"POST",
   headers:{ "Content-Type":"application/json" },
   body: JSON.stringify({ token })
  })

  if(!res.ok){
   throw new Error("send otp failed")
  }

  sendMetric("otp/resend")

  // ✅ รีเวลาใหม่ "เฉพาะตอนกด resend"
  const newExpire = Date.now() + 60000
  sessionStorage.setItem("otp_expire", newExpire)

  startOTPCountdown(newExpire)

  alert("OTP resent!")

 }catch(err){
  console.log(err)
  alert("Resend failed")
 }

 // cooldown 10 วิ
 setTimeout(()=>{
  resendLock = false
  btn.disabled = false
 },10000)
}

// ---------------- Page Load ----------------
window.onload = function(){

 // 🔒 ไม่มี email = กลับ login
 if(!sessionStorage.getItem("otp_email")){
  window.location = "index.html"
  return
 }

 initOTP()
}

// ---------------- Prevent Back Cache ----------------
window.addEventListener("pageshow", function(event){
 if(event.persisted){
  window.location.reload()
 }
})