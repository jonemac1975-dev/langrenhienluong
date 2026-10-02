//======================================================
// HIENLUONG WEBSITE
// File : admin/js/thongbao.js
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
createEditor("tb-editor");
bindEvents();
await loadData();
}

function bindEvents(){
document.getElementById("tb-image-file")?.addEventListener("change",loadImage);
document.getElementById("btn-tb-save")?.addEventListener("click",saveData);
}

async function loadData(){
DATA=await readData("admin/thongbao")||{};
renderTable();
}

function renderTable(){
const body=document.getElementById("tb-body");
body.innerHTML="";
let stt=1;
Object.keys(DATA).sort().forEach(id=>{
const r=DATA[id];
const text=(r.content||"").replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim();
const shortText=text.length>60?text.substring(0,60)+"...":text;
const img=r.image?`<img src="${r.image}" style="width:45px;height:45px;object-fit:cover;border-radius:4px;">`:"-";

body.innerHTML+=`
<tr>
<td>${stt++}</td>
<td>${img}</td>
<td>${r.title||""}</td>
<td class="tb-content" title="${text}">${shortText}</td>
<td>${r.author||""}</td>
<td>${r.source||""}<br>${r.date||""}</td>
<td>
<button onclick="editThongbao('${id}')">Sửa</button>
<button onclick="deleteThongbao('${id}')">Xóa</button>
</td>
</tr>`;
});
}

async function loadImage(e){

const file=e.target.files[0];
if(!file)return;
try{
imageBase64 = await compressImage(file,"image");
const img = document.getElementById("tb-preview");
img.src = imageBase64;
img.style.display = "block";

}catch(error){
console.error(error);
alert(error.message||"Không thể xử lý ảnh.");

}
}


async function saveData(){

const title = document.getElementById("tb-title-input").value.trim();
const content = getHtml("tb-editor");
const author = document.getElementById("tb-author").value.trim();
//const source = document.getElementById("tb-source").value.trim();
const date = document.getElementById("tb-date").value;

if(title===""){
alert("Nhập tiêu đề.");
return;
}

if(editId===""){
editId="tb"+Date.now();
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
const file = new File([blob],"thongbao.jpg",{type:"image/jpeg"});
const media = await uploadToCloudinary(file,"hienluong/admin/thongbao");
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
title,
content,
author,
date,
image:imageUrl,
image_public_id:imagePublicId,
updated_at:Date.now()
};

const firebaseOK = await writeData("admin/thongbao",DATA);

if(!firebaseOK){
throw new Error("Firebase lưu dữ liệu thất bại.");
}

alert("Đã lưu.");
clearForm();
await loadData();
}

window.editThongbao=function(id){

const r=DATA[id];
if(!r)return;
editId=id;
imageBase64=r.image||"";

document.getElementById("tb-title-input").value=r.title||"";
document.getElementById("tb-author").value=r.author||"";
document.getElementById("tb-date").value=r.date||"";
setHtml("tb-editor",r.content||"");
const img=document.getElementById("tb-preview");
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

window.deleteThongbao=async function(id){

if(!confirm("Xóa thông báo này?"))return;
const record=DATA[id];

if(!record){
alert("❌ Không tìm thấy dữ liệu.");
return;
}

try{

//==================================================
// XÓA ẢNH CLOUDINARY
//==================================================

const publicId=
record.image_public_id||"";

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
throw new Error(result.result||"Cloudinary xóa ảnh thất bại.");
}
}

//==================================================
// XÓA FIREBASE
//==================================================

delete DATA[id];

const firebaseOK = await writeData("admin/thongbao",DATA);

if(!firebaseOK){
throw new Error("Firebase xóa dữ liệu thất bại.");
}
alert("Đã xóa.");
clearForm();
await loadData();

}
catch(error){
console.error("❌ DELETE TƯ LIỆU ERROR:",error);

alert("❌ Không thể xóa tư liệu.\n\n"+error.message);

}
};


function clearForm(){

editId="";
imageBase64="";

document.getElementById("tb-title-input").value="";
document.getElementById("tb-author").value="";
document.getElementById("tb-date").value="";
document.getElementById("tb-image-file").value="";
setHtml("tb-editor","");
const img=document.getElementById("tb-preview");
img.removeAttribute("src");
img.style.display="none";
}