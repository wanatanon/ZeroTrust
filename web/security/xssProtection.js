function detectXSS(input){

 const patterns = [
  "<script",
  "</script>",
  "javascript:",
  "onerror",
  "onload",
  "<img",
  "<svg",
  "<iframe"
 ]

 input = input.toLowerCase()

 for(let i=0;i<patterns.length;i++){
  if(input.includes(patterns[i])){
   return true
  }
 }

 return false

}

function checkURLXSS(){

 const params = new URLSearchParams(window.location.search)

 for(const value of params.values()){

  if(detectXSS(value)){

   alert("XSS detected in URL")

   window.location="index.html"

   return

  }

 }

}