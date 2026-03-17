function checkDeviceTrust(){

 const agent = navigator.userAgent

 const isChrome = agent.includes("Chrome") && !agent.includes("Edg")

 if(!isChrome){

  alert("Only Chrome allowed")

  window.location="/index.html"

 }

}