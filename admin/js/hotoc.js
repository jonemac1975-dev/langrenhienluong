//======================================================
// HIENLUONG WEBSITE
// File : admin/js/hotoc.js
//======================================================

import{readData,writeData}from "../../scripts/firebaseService.js";
import{createEditor,getHtml,setHtml}from "../../js/editor.js";
import{compressImage}from "../../scripts/compressImage.js";
import{uploadToCloudinary}from "../../scripts/cloudinaryUpload.js";
import{getAuth}from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import{app}from "../../scripts/firebaseConfig.js";

const auth=getAuth(app);
let DATA={};
let editId="";
let imageBase64="";
let imagePublicId="";

export async function init(){
createEditor("ht-editor");
bindEvents();
await loadData();
}

function bindEvents(){
document.getElementById("ht-image-file").onchange=loadImage;
document.getElementById("btn-ht-save").onclick=saveData;
}

async function loadData(){
DATA=await readData("admin/hotoc")||{};
renderTable();
}

function renderTable(){
const body=document.getElementById("ht-body");
body.innerHTML="";
let stt=1;
Object.keys(DATA).sort().forEach(id=>{
const r=DATA[id];
const mapLink=r.map?`<a href="${r.map}" target="_blank">🌍 Xem</a>`:"-";
const webLink=r.web?`<a href="${r.web}" target="_blank">🌐 Xem</a>`:"-";
body.innerHTML+=`
<tr>
<td>${stt++}</td>
<td>${r.name||""}</td>
<td>${mapLink}</td>
<td>${webLink}</td>
<td>
<button onclick="editHoToc('${id}')">Sửa</button>
<button onclick="deleteHoToc('${id}')">Xóa</button>
</td>
</tr>`;
});
}

async function loadImage(e){

const file=e.target.files[0];
if(!file)return;
try{
imageBase64 = await compressImage(file,"image");
const img = document.getElementById("ht-preview");
img.src = imageBase64;
img.style.display = "block";

}catch(error){
console.error(error);
alert(error.message|| "Không thể xử lý ảnh.");

}
}

async function saveData(){

const name = document.getElementById("ht-name").value.trim();
const map = document.getElementById("ht-map").value.trim();
const web = document.getElementById("ht-web").value.trim();
const content = getHtml("ht-editor");

if(name===""){
alert("Nhập tên họ tộc.");
return;
}

if(editId===""){
editId = "ht"+Date.now();
}

//==================================================
// GIỮ ẢNH CŨ
//==================================================

let imageUrl = DATA[editId]?.image||"";
let oldPublicId = DATA[editId]?.image_public_id||"";
let imagePublicId = oldPublicId;

//==================================================
// UPLOAD ẢNH MỚI
//==================================================

if(imageBase64){
const response = await fetch(imageBase64);
const blob = await response.blob();
const file = new File([blob],"hotoc.jpg",{type:"image/jpeg"});

const media = await uploadToCloudinary(file,"hienluong/admin/hotoc");
imageUrl = media.secure_url;
imagePublicId = media.public_id;


//==================================================
// XÓA ẢNH CŨ
//==================================================

if(oldPublicId){

const user = auth.currentUser;
if(!user){
throw new Error("Chưa đăng nhập Firebase Auth.");
}

const token = await user.getIdToken(true);
const response=
await fetch(
"https://hienluong-auth-test.jonemac1975.workers.dev/cloudinary/delete",
{
method:"POST",
headers:{
"Authorization":
"Bearer "+token,
"Content-Type":
"application/json"
},
body:
JSON.stringify({
public_id:
oldPublicId
})
}
);

const result = await response.json();
if(
!response.ok||
!result.success
){
throw new Error(result.result||"Cloudinary xóa ảnh cũ thất bại.");
}
}
}

//==================================================
// LƯU FIREBASE
//==================================================

DATA[editId]={
name,
content,
map,
web,
image:imageUrl,
image_public_id:imagePublicId,
updated_at:Date.now()
};

const firebaseOK = await writeData("admin/hotoc",DATA);

if(!firebaseOK){
throw new Error("Firebase lưu dữ liệu thất bại.");
}

alert("Đã lưu.");
clearForm();
await loadData();
}

window.editHoToc=function(id){

const r=DATA[id];
if(!r)return;
editId=id;
imageBase64=r.image||"";
document.getElementById("ht-name").value=r.name||"";
document.getElementById("ht-map").value=r.map||"";
document.getElementById("ht-web").value=r.web||"";
setHtml("ht-editor",r.content||"");
const img=document.getElementById("ht-preview");
if(imageBase64){
img.src=imageBase64;
img.style.display="block";

}else{
img.removeAttribute("src");
img.style.display="none";
}

window.scrollTo({
top:0,
behavior:"smooth"
});

};


window.deleteHoToc=async function(id){

if(!confirm("Xóa họ tộc này?"))return;
const record=DATA[id];
if(!record){
alert("❌ Không tìm thấy dữ liệu.");
return;
}

try{

//==================================================
// XÓA ẢNH CLOUDINARY
//==================================================

const publicId = record.image_public_id||"";
if(publicId){
const user = auth.currentUser;
if(!user){
throw new Error("Chưa đăng nhập Firebase Auth.");
}

const token = await user.getIdToken(true);
const response=
await fetch(
"https://hienluong-auth-test.jonemac1975.workers.dev/cloudinary/delete",
{
method:"POST",
headers:{
"Authorization":
"Bearer "+token,
"Content-Type":
"application/json"
},
body:
JSON.stringify({
public_id:
publicId
})
}
);

const result = await response.json();
if(
!response.ok||
!result.success
){
throw new Error(result.result|| "Cloudinary xóa ảnh thất bại.");
}
}

//==================================================
// XÓA FIREBASE
//==================================================

delete DATA[id];
const firebaseOK = await writeData("admin/hotoc",DATA);
if(!firebaseOK){
throw new Error("Firebase xóa dữ liệu thất bại.");
}
alert("Đã lxóa.");
clearForm();
await loadData();

}
catch(error){
console.error("❌ DELETE HỌ TỘC ERROR:",error);

alert("❌ Không thể xóa họ tộc.\n\n"+error.message);
}
};


function clearForm(){

editId="";
imageBase64="";

document.getElementById("ht-name").value="";
document.getElementById("ht-map").value="";
document.getElementById("ht-web").value="";
document.getElementById("ht-image-file").value="";
setHtml("ht-editor","");
const img=document.getElementById("ht-preview");
img.removeAttribute("src");
img.style.display="none";
}