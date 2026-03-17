checkDeviceTrust()
checkNetworkTrust()

// กัน Back Cache
window.addEventListener("pageshow", function(event){

 if(event.persisted){
  window.location.reload()
 }

})

firebase.auth().onAuthStateChanged(async function(user){

 if(!user){
  window.location="/index.html"
  return
 }

 const doc = await db.collection("users").doc(user.uid).get()

 if(!doc.exists){
  window.location="/index.html"
  return
 }

 if(doc.data().role !== "ADMIN"){
  alert("Access Denied")
  window.location="/index.html"
  return
 }

 document.body.style.display="block"

})

function logout(){

 firebase.auth().signOut().then(function(){

  window.location.replace("/index.html")

 })

}

function createUser(){

 const email = document.getElementById("email").value
 const password = document.getElementById("password").value
 const role = document.getElementById("role").value.toUpperCase()

 firebase.auth().createUserWithEmailAndPassword(email,password)

 .then(function(userCredential){

  const uid = userCredential.user.uid

  db.collection("users").doc(uid).set({
   email: email,
   role: role
  })

  alert("User Created")

 })

 .catch(function(error){

  alert(error.message)

 })

}