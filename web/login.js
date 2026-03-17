window.sendMetric = function(type){
 fetch("http://localhost:4000/" + type,{
  method:"GET",
  mode:"cors",
  keepalive:true   // 🔥 เพิ่ม (กัน metric หายตอน redirect)
 }).catch(()=>{})
}

async function login(){

 let email = document.getElementById("email").value
 let password = document.getElementById("password").value

 // SQL Injection
 if(detectSQLInjection(email) || detectSQLInjection(password)){
  alert("SQL Injection detected")
  sendMetric("attack")
  sendMetric("attack/sql")
  return
 }

 // XSS
 if(detectXSS(email) || detectXSS(password)){
  alert("XSS detected")
  sendMetric("attack")
  sendMetric("attack/xss")
  return
 }

 // Brute Force
 if(checkBruteForce()){
  sendMetric("attack")
  sendMetric("attack/brute")
  return
 }

 // login attempt
 sendMetric("login")

 try{

  const userCredential = await auth.signInWithEmailAndPassword(email,password)

  localStorage.removeItem("loginAttempts")
  localStorage.removeItem("lockTime")

  const token = await userCredential.user.getIdToken()
  const userEmail = userCredential.user.email
  const uid = userCredential.user.uid

  // ✅ เก็บ token
  sessionStorage.setItem("firebase_token", token)

  const doc = await db.collection("users").doc(uid).get()
  const role = doc.data().role

  sessionStorage.setItem("user_role", role)
  sessionStorage.setItem("otp_email", userEmail)

  // 🔥 ส่ง OTP (รอให้เสร็จจริง)
  const res = await fetch("http://localhost:4000/send-otp", {
   method:"POST",
   headers:{ "Content-Type":"application/json" },
   body: JSON.stringify({ token })
  })

  if(!res.ok){
   throw new Error("OTP send failed")
  }

  // 🔥 ตั้งเวลา OTP ครั้งแรก
  const expire = Date.now() + 60000
  sessionStorage.setItem("otp_expire", expire)

  // 🔥 delay นิด (กัน metric หาย)
  setTimeout(()=>{
   window.location = "otp.html"
  },300)

 }catch(err){

  console.log(err)

  sendMetric("fail")

  recordFailedAttempt()
 }
}



function startCountdown(lockTime){

 const countdown = document.getElementById("countdown")

 if(!countdown) return

 const timer = setInterval(function(){

  const now = Date.now()
  const distance = lockTime - now

  if(distance <= 0){

   clearInterval(timer)

   countdown.innerHTML = ""

   localStorage.removeItem("loginAttempts")
   localStorage.removeItem("lockTime")

   return

  }

  const seconds = Math.ceil(distance/1000)

  countdown.innerHTML = "Login locked. Try again in " + seconds + " seconds"

 },1000)

}



window.onload = function(){

 if(typeof checkNetworkTrust === "function"){
  checkNetworkTrust()
 }

 if(typeof checkURLXSS === "function"){
  checkURLXSS()
 }

 const lockTime = parseInt(localStorage.getItem("lockTime"))

 if(lockTime && Date.now() < lockTime){
  startCountdown(lockTime)
 }

}