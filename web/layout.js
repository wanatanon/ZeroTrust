function loadLayout(){

 // Navbar
 document.body.insertAdjacentHTML("afterbegin", `
  <div class="navbar">
    <h2>Zero Trust System</h2>
    <span id="roleText"></span>
  </div>
 `)

 // Footer
 document.body.insertAdjacentHTML("beforeend", `
  <div class="footer">
    <p>© 2026 Zero Trust Project</p>
  </div>
 `)

 // ใส่ role
 setTimeout(()=>{
  const role = sessionStorage.getItem("user_role") || "Guest"
  const el = document.getElementById("roleText")
  if(el) el.innerText = role
 },100)

}