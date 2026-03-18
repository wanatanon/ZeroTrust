function detectXSS(input){

 const pattern = /(<.*script.*>|javascript:|onerror|onload|<img|<svg|<iframe|alert\s*\()/i

 return pattern.test(input)
}

function checkURLXSS(){

 const params = new URLSearchParams(window.location.search)

 for(const value of params.values()){

  let decoded = value

  try{
   decoded = decodeURIComponent(value)
  }catch(e){}

  console.log("CHECK:", decoded) // debug

  if(detectXSS(decoded)){

 alert("XSS detected in URL")

 sendMetric("attack")
 sendMetric("attack/xss")

 setTimeout(()=>{
  window.location = "index.html"
 },300)

 return
}
 }
}