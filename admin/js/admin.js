//======================================================
// HIENLUONG WEBSITE
// File : admin.js
//======================================================

if (sessionStorage.getItem("adminLogin") !== "1") {
    location.href = "adminlogin.html";
    throw new Error("Not Login");
}

document.addEventListener("DOMContentLoaded", init);

function init(){
    bindMenu();
    bindHeader();
    loadPage("gioithieu");
 }

//======================================================

function bindHeader(){
    document.getElementById("btn-home")?.addEventListener("click",()=>{
        location.href="../../index.html";
    });

    document.getElementById("btn-change").onclick=()=>{
    location.href="adminchange.html";
};
}

//======================================================

function bindMenu(){
    document.querySelectorAll(".ad-menu").forEach(btn=>{
        btn.onclick=()=>{
            document.querySelectorAll(".ad-menu")
            .forEach(m=>m.classList.remove("active"));
            btn.classList.add("active");
            loadPage(btn.dataset.page);
        };
    });
}

//======================================================

async function loadPage(page){

const container=document.getElementById("admin-content");
if(!container)return;

try{

const html=await fetch(`/admin/tab/${page}.html`);
if(!html.ok){
throw new Error(
"Không tìm thấy: /admin/tab/"+page+".html"
);
}

container.innerHTML=await html.text();
const module=await import(`./${page}.js?t=${Date.now()}`);

if(module.init){
module.init();
}
}

catch(err){
console.error(err);
container.innerHTML="<h3>Không tải được dữ liệu.</h3>";
}
}