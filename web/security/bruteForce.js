let maxAttempts = 3
let lockDuration = 10

function sendMetric(type){

 fetch("http://localhost:4000/" + type,{
  method:"GET",
  mode:"cors"
 }).catch(()=>{})

}

function checkBruteForce(){

 let lockTime = localStorage.getItem("lockTime")

 if(lockTime){

  let remaining = Math.floor((lockTime - Date.now())/1000)

  if(remaining > 0){

   startCountdown(lockTime)

   return true

  } else {

   // reset หลังหมดเวลา
   localStorage.removeItem("loginAttempts")
   localStorage.removeItem("lockTime")

  }

 }

 return false

}


function recordFailedAttempt(){

 let attempts = parseInt(localStorage.getItem("loginAttempts")) || 0

 attempts++

 localStorage.setItem("loginAttempts", attempts)

 if(attempts === maxAttempts){

  sendMetric("attack")
  sendMetric("attack/brute")

  let lock = Date.now() + (lockDuration * 1000)

  localStorage.setItem("lockTime", lock)

  startCountdown(lock)

  alert("Too many attempts. Locked for 10 seconds")

 }

 else{

  alert("Login failed (" + attempts + "/3)")

 }

}