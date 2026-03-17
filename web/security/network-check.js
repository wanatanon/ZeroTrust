function checkNetworkTrust(){

 const host = window.location.hostname

 // block loopback ทั้งช่วง
 if(host.startsWith("127.")){
  alert("Network not trusted")
  window.location = "index.html"
  return
 }

 const allowedHosts = [
  "localhost",
  "192.168.1.100"   // ใส่ IP เครื่อง server จริง
 ]

 if(!allowedHosts.includes(host)){
  alert("Network not trusted")
  window.location = "index.html"
 }

}