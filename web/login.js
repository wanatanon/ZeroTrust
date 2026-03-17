window.sendMetric = function(type){

 fetch("http://localhost:4000/" + type,{
  method:"GET",
  mode:"cors"
 }).catch(()=>{})

}

function login(){

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

 // firebase auth
 auth.signInWithEmailAndPassword(email,password)

 .then((userCredential)=>{

  sendMetric("success")

  localStorage.removeItem("loginAttempts")
  localStorage.removeItem("lockTime")

  let uid = userCredential.user.uid

  db.collection("users").doc(uid).get()

  .then((doc)=>{

   let role = doc.data().role

   sessionStorage.setItem("user_role", role)

   if(role=="HR"){
    window.location="hr/hr.html"
   }

   else if(role=="ADMIN"){
    window.location="admin/admin.html"
   }

  })

 })

 .catch((err)=>{

 sendMetric("fail")

 recordFailedAttempt()

})

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