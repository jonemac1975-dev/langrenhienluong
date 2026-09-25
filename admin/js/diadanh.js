//======================================================
// HIENLUONG WEBSITE
// File : admin/js/danhthang.js
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
createEditor("dd-editor");
bindEvents();
await loadData();
}

function bindEvents(){
document.getElementById("dd-image-file").onchange=loadImage;
document.getElementById("btn-dd-save").onclick=saveData;
}

async function loadData(){
DATA=await readData("admin/diadanh")||{};
renderTable();
}

function renderTable(){
const body=document.getElementById("dd-body");
body.innerHTML="";
let stt=1;
Object.keys(DATA).sort().forEach(id=>{
const r=DATA[id];
const content=(r.content||"")
.replace(/<[^>]+>/g,"")
.replace(/\s+/g," ")
.trim();

const shortContent = content.length>30 ?content.substring(0,30)+"...":content;
body.innerHTML+=`
<tr>
<td>${stt++}</td>
<td>${r.name||""}</td>
<td>${r.address||""}</td>
<td>${r.map?'<a href="'+r.map+'" target="_blank">🌍 Xem</a>':'-'}</td>
<td>${r.video?'<a href="'+r.video+'" target="_blank">🎥 Xem</a>':'-'}</td>
<td class="tb-content" title="${content}">${shortContent}</td>
<td>
<button onclick="editDiaDanh('${id}')">Sửa</button>
<button onclick="deleteDiaDanh('${id}')">Xóa</button>
</td>
</tr>`;
});
}


async function loadImage(e){

const file=e.target.files[0];
if(!file)return;
try{

imageBase64 = await compressImage(file,"image");
const img = document.getElementById("dd-preview");
img.src=imageBase64;
img.style.display="block";

}catch(error){
console.error(error);
alert(error.message||"Không thể xử lý ảnh.");

}
}

async function saveData(){

const name=document.getElementById("dd-name").value.trim();
const address=document.getElementById("dd-address").value.trim();
const map=document.getElementById("dd-map").value.trim();
const video=document.getElementById("dd-video").value.trim();
const content=getHtml("dd-editor");

if(name===""){
alert("Nhập tên Địa Danh.");
return;
}

if(editId===""){
editId="dd"+Date.now();
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
const file = new File([blob],"diadanh.jpg",{type:"image/jpeg"});
const media = await uploadToCloudinary(file,"hienluong/admin/diadanh");
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
throw new Error(
result.result||
"Cloudinary xóa ảnh cũ thất bại."
);
}
}
}

//==================================================
// LƯU FIREBASE
//==================================================

DATA[editId]={
name,
address,
map,
video,
content,
image:imageUrl,
image_public_id:imagePublicId,
updated_at:Date.now()
};

const firebaseOK = await writeData("admin/diadanh",DATA);

if(!firebaseOK){
throw new Error(
"Firebase lưu dữ liệu thất bại."
);
}

alert("Đã lưu.");
clearForm();
await loadData();
}


window.editDiaDanh=function(id){
const r=DATA[id];
if(!r)return;
editId=id;
imageBase64=r.image||"";
document.getElementById("dd-name").value=r.name||"";
document.getElementById("dd-address").value=r.address||"";
document.getElementById("dd-map").value=r.map||"";
document.getElementById("dd-video").value=r.video||"";
setHtml("dd-editor",r.content||"");
const img=document.getElementById("dd-preview");
if(imageBase64){
img.src=imageBase64;
img.style.display="block";
}else{
img.removeAttribute("src");
img.style.display="none";
}
window.scrollTo({top:0,behavior:"smooth"});
}


window.deleteDiaDanh=async function(id){

if(!confirm("Xóa địa danh này?"))return;
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
throw new Error(
"Chưa đăng nhập Firebase Auth."
);
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

const result=
await response.json();

if(
!response.ok||
!result.success
){
throw new Error(
result.result||
"Cloudinary xóa ảnh thất bại."
);
}
}

//==================================================
// XÓA FIREBASE
//==================================================

delete DATA[id];

const firebaseOK = await writeData("admin/diadanh",DATA);

if(!firebaseOK){
throw new Error(
"Firebase xóa dữ liệu thất bại."
);
}
alert("Đã xóa.");
clearForm();
await loadData();

}
catch(error){

console.error("❌ DELETE ĐỊA DANH ERROR:",error);
alert("❌ Không thể xóa địa danh.\n\n" + error.message);

}
};


function clearForm(){
editId="";
imageBase64="";
document.getElementById("dd-name").value="";
document.getElementById("dd-address").value="";
document.getElementById("dd-map").value="";
document.getElementById("dd-video").value="";
document.getElementById("dd-image-file").value="";
setHtml("dd-editor","");
const img=document.getElementById("dd-preview");
img.removeAttribute("src");
img.style.display="none";
}