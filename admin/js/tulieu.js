//======================================================
// HIENLUONG WEBSITE
// File : admin/js/tulieu.js
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
createEditor("tl-editor");
bindEvents();
await loadData();
}

function bindEvents(){
document.getElementById("tl-image-file")?.addEventListener("change",loadImage);
document.getElementById("btn-tl-save")?.addEventListener("click",saveData);
}

async function loadData(){
DATA=await readData("admin/tulieu")||{};
renderTable();
}

function renderTable(){
const body=document.getElementById("tl-body");
body.innerHTML="";
let stt=1;
Object.keys(DATA).sort().forEach(id=>{
const r=DATA[id];
const text=(r.content||"").replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim();
const shortText=text.length>60?text.substring(0,60)+"...":text;
const img=r.image?`<img src="${r.image}" style="width:45px;height:45px;object-fit:cover;border-radius:4px;">`:"-";
const link=r.link?`<a href="${r.link}" target="_blank">🔗 Xem</a>`:"-";
body.innerHTML+=`
<tr>
<td>${stt++}</td>
<td>${r.type||""}</td>
<td>${r.title||""}</td>
<td class="tb-content" title="${text}">${shortText}</td>
<td>${r.author||""}</td>
<td>${img}</td>
<td>${link}</td>
<td>${r.source||""}<br>${r.date||""}</td>
<td>
<button onclick="editTuLieu('${id}')">Sửa</button>
<button onclick="deleteTuLieu('${id}')">Xóa</button>
</td>
</tr>`;
});
}

async function loadImage(e){

const file=e.target.files[0];
if(!file)return;
try{
imageBase64 = await compressImage(file,"image");
const img = document.getElementById("tl-preview");
img.src = imageBase64;
img.style.display = "block";

}catch(error){
console.error(error);
alert(error.message||"Không thể xử lý ảnh.");

}
}


async function saveData(){

const type = document.getElementById("tl-type").value;
const title = document.getElementById("tl-title-input").value.trim();
const content = getHtml("tl-editor");
const link = document.getElementById("tl-link").value.trim();
const author = document.getElementById("tl-author").value.trim();
const source = document.getElementById("tl-source").value.trim();
const date = document.getElementById("tl-date").value;

if(title===""){
alert("Nhập tiêu đề.");
return;
}

if(editId===""){
editId="tl"+Date.now();
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
const file = new File([blob],"tulieu.jpg",{type:"image/jpeg"});
const media = await uploadToCloudinary(file,"hienluong/admin/tulieu");
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
type,
title,
content,
link,
author,
source,
date,
image:imageUrl,
image_public_id:imagePublicId,
updated_at:Date.now()
};

const firebaseOK = await writeData("admin/tulieu",DATA);

if(!firebaseOK){
throw new Error("Firebase lưu dữ liệu thất bại.");
}

alert("Đã lưu.");
clearForm();
await loadData();
}

window.editTuLieu=function(id){

const r=DATA[id];
if(!r)return;
editId=id;
imageBase64=r.image||"";

document.getElementById("tl-type").value=r.type||"Văn bản";
document.getElementById("tl-title-input").value=r.title||"";
document.getElementById("tl-link").value=r.link||"";
document.getElementById("tl-author").value=r.author||"";
document.getElementById("tl-source").value=r.source||"";
document.getElementById("tl-date").value=r.date||"";
setHtml("tl-editor",r.content||"");
const img=document.getElementById("tl-preview");
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

window.deleteTuLieu=async function(id){

if(!confirm("Xóa tư liệu này?"))return;
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

const firebaseOK = await writeData("admin/tulieu",DATA);

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

document.getElementById("tl-type").selectedIndex=0;
document.getElementById("tl-title-input").value="";
document.getElementById("tl-link").value="";
document.getElementById("tl-author").value="";
document.getElementById("tl-source").value="";
document.getElementById("tl-date").value="";
document.getElementById("tl-image-file").value="";
setHtml("tl-editor","");
const img=document.getElementById("tl-preview");
img.removeAttribute("src");
img.style.display="none";
}