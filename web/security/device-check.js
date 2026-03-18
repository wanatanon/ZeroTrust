function checkDeviceTrust(){

 const agent = navigator.userAgent

 const isChrome = agent.includes("Chrome") && !agent.includes("Edg")

 if(!isChrome){

  fetch("http://localhost:4000/log/device",{
   method:"POST",
   headers:{"Content-Type":"application/json"},
   body: JSON.stringify({
    type: "device_block",
    userAgent: agent,
    time: new Date().toISOString()
   })
  }).catch(()=>{})

  alert("Only Google Chrome allowed")

  window.location="/index.html"
 }
}