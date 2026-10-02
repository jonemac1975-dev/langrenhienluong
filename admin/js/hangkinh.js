import{readData,writeData}from "../../scripts/firebaseService.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {app} from "../../scripts/firebaseConfig.js";

let DATA={};
let editId="";

export async function init(){
bindEvents();
await loadData();
}

function bindEvents(){
document.getElementById("btn-hk-save")?.addEventListener("click",saveData);

const userInput=document.getElementById("hk-user");
const emailInput=document.getElementById("hk-email");

if(userInput&&emailInput){
    userInput.addEventListener("input",()=>{
        const user=userInput.value.trim().toLowerCase();
        emailInput.value=user?`${user}@hienluong.com`:"";
    });
}
}

async function loadData(){
DATA=await readData("admin/hangkinh")||{};
renderTable();
}

function renderTable(){
const body=document.getElementById("hk-body");
if(!body)return;
body.innerHTML="";
const rows=Object.entries(DATA).sort((a,b)=>(Number(a[1].stt)||0)-(Number(b[1].stt)||0));
rows.forEach(([id,r])=>{
body.innerHTML+=`
<tr>
<td>${r.stt||""}</td>
<td>${r.name||""}</td>
<td>${r.city||""}</td>
<td>${r.leader||""}</td>
<td>${r.user||""}</td>
<td>${r.pass||""}</td>
<td>
<button onclick="editHangKinh('${id}')">Sửa</button>
<button onclick="deleteHangKinh('${id}')">Xóa</button>
</td>
</tr>`;
});
}

async function saveData(){
const isNew=!editId;
const stt=document.getElementById("hk-stt").value.trim();
const name=document.getElementById("hk-name").value.trim();
const city=document.getElementById("hk-city").value.trim();
const leader=document.getElementById("hk-leader").value.trim();
const user=document.getElementById("hk-user").value.trim();
const email=document.getElementById("hk-email").value.trim();
const pass=document.getElementById("hk-pass").value.trim();

if(stt===""){
alert("Nhập STT.");
return;
}
if(name===""){
alert("Nhập tên hàng kỉnh.");
return;
}
if(user===""){
alert("Nhập User login.");
return;
}
if(email===""){
alert("Email Auth chưa được tạo.");
return;
}

if(isNew){
if(pass===""){
alert("Nhập Pass login.");
return;
}
if(pass.length<6){
alert("❌ Pass login phải có ít nhất 6 ký tự.");
return;
}

try{
const auth=getAuth(app);
const currentUser=auth.currentUser;

if(!currentUser){
alert("❌ Phiên Admin đã hết. Vui lòng đăng nhập lại.");
return;
}

const idToken=await currentUser.getIdToken();

const response=await fetch("https://hienluong-auth-test.jonemac1975.workers.dev/hangkinh/create-user",{
method:"POST",
headers:{
"Authorization":"Bearer "+idToken,
"Content-Type":"application/json"
},
body:JSON.stringify({
email,
password:pass
})
});

const result=response.ok?await response.json():{success:false,error:await response.text()};

if(!response.ok||!result.success){
console.error("❌ CREATE HÀNG KỈNH AUTH ERROR:",result);
throw new Error(result.error||"Không thể tạo tài khoản Firebase Auth.");
}

editId="hk"+Date.now();

DATA[editId]={
stt:Number(stt),
name,
city,
leader,
user,
email:result.email||email,
uid:result.uid||"",
pass,
updated_at:Date.now()
};

}catch(error){
console.error("❌ TẠO TÀI KHOẢN HÀNG KỈNH ERROR:",error);
alert("❌ Không thể tạo tài khoản Hàng Kỉnh.\n\n"+error.message);
return;
}
}else{
if(!DATA[editId]){
alert("❌ Không tìm thấy dữ liệu Hàng Kỉnh.");
return;
}

DATA[editId]={
...DATA[editId],
stt:Number(stt),
name,
city,
leader,
user,
email,
pass,
updated_at:Date.now()
};
}

const firebaseOK=await writeData("admin/hangkinh",DATA);

if(!firebaseOK){
alert("❌ Firebase lưu dữ liệu thất bại.");
return;
}

alert(isNew?"✅ Đã tạo tài khoản Firebase và cập nhật Hàng Kỉnh.":"✅ Đã cập nhật Hàng Kỉnh.");
clearForm();
await loadData();
}

window.editHangKinh=function(id){
const r=DATA[id];
if(!r)return;

editId=id;

document.getElementById("hk-stt").value=r.stt||"";
document.getElementById("hk-name").value=r.name||"";
document.getElementById("hk-city").value=r.city||"";
document.getElementById("hk-leader").value=r.leader||"";
document.getElementById("hk-user").value=r.user||"";
document.getElementById("hk-email").value=r.email||"";
document.getElementById("hk-pass").value=r.pass||"";

window.scrollTo({
top:0,
behavior:"smooth"
});
};

window.deleteHangKinh=async function(id){
if(!confirm("Xóa hàng kỉnh này?"))return;

if(!DATA[id]){
alert("❌ Không tìm thấy dữ liệu.");
return;
}

try{
delete DATA[id];

const firebaseOK=await writeData("admin/hangkinh",DATA);

if(!firebaseOK){
throw new Error("Firebase xóa dữ liệu thất bại.");
}

alert("Đã xóa.");
clearForm();
await loadData();
}catch(error){
console.error("❌ DELETE HÀNG KỈNH ERROR:",error);
alert("❌ Không thể xóa hàng kỉnh.\n\n"+error.message);
}
};

function clearForm(){
editId="";
document.getElementById("hk-stt").value="";
document.getElementById("hk-name").value="";
document.getElementById("hk-city").value="";
document.getElementById("hk-leader").value="";
document.getElementById("hk-user").value="";
document.getElementById("hk-email").value="";
document.getElementById("hk-pass").value="";
}