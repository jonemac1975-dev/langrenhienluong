//======================================================
// HIENLUONG WEBSITE
// File : admin/js/danhthang.js
//======================================================

import{readData,writeData}from "../../scripts/firebaseService.js";
import{createEditor,getHtml,setHtml}from "../../js/editor.js";
import{compressImage}from "../../scripts/compressImage.js";

let DATA={};
let editId="";
let imageBase64="";

export async function init(){
createEditor("dt-editor");
bindEvents();
await loadData();
}

function bindEvents(){
document.getElementById("dt-image-file").onchange=loadImage;
document.getElementById("btn-dt-save").onclick=saveData;
}

async function loadData(){
DATA=await readData("admin/danhthang")||{};
renderTable();
}

function renderTable(){
const body=document.getElementById("dt-body");
body.innerHTML="";
let stt=1;
Object.keys(DATA).sort().forEach(id=>{
const r=DATA[id];
const content=(r.content||"")
.replace(/<[^>]+>/g,"")
.replace(/\s+/g," ")
.trim();

const shortContent = content.length>30 ?content.substring(0,22)+"...":content;
body.innerHTML+=`
<tr>
<td>${stt++}</td>
<td>${r.name||""}</td>
<td>${r.address||""}</td>
<td>${r.map?'<a href="'+r.map+'" target="_blank">🌍 Xem</a>':'-'}</td>
<td>${r.video?'<a href="'+r.video+'" target="_blank">🎥 Xem</a>':'-'}</td>
<td class="tb-content" title="${content}">${shortContent}</td>
<td>
<button onclick="editDanhThang('${id}')">Sửa</button>
<button onclick="deleteDanhThang('${id}')">Xóa</button>
</td>
</tr>`;
});
}

async function loadImage(e){
const file=e.target.files[0];
if(!file)return;

try{

imageBase64=await compressImage(file,"image");

const img=document.getElementById("dt-preview");

img.src=imageBase64;
img.style.display="block";

console.log(
"Ảnh danh thắng sau nén:",
imageBase64.length,
"ký tự Base64"
);

}catch(error){

console.error(error);

alert(
error.message||
"Không thể xử lý ảnh."
);

}
}

async function saveData(){
const name=document.getElementById("dt-name").value.trim();
const address=document.getElementById("dt-address").value.trim();
const map=document.getElementById("dt-map").value.trim();
const video=document.getElementById("dt-video").value.trim();
const content=getHtml("dt-editor");
if(name===""){
alert("Nhập tên danh thắng.");
return;
}
if(editId==="")editId="dt"+Date.now();
DATA[editId]={
name,
address,
map,
video,
content,
image:imageBase64,
updated_at:Date.now()
};
await writeData("admin/danhthang",DATA);
alert("Đã lưu.");
clearForm();
await loadData();
}

window.editDanhThang=function(id){
const r=DATA[id];
if(!r)return;
editId=id;
imageBase64=r.image||"";
document.getElementById("dt-name").value=r.name||"";
document.getElementById("dt-address").value=r.address||"";
document.getElementById("dt-map").value=r.map||"";
document.getElementById("dt-video").value=r.video||"";
setHtml("dt-editor",r.content||"");
const img=document.getElementById("dt-preview");
if(imageBase64){
img.src=imageBase64;
img.style.display="block";
}else{
img.removeAttribute("src");
img.style.display="none";
}
window.scrollTo({top:0,behavior:"smooth"});
}

window.deleteDanhThang=async function(id){
if(!confirm("Xóa danh thắng này?"))return;
delete DATA[id];
await writeData("admin/danhthang",DATA);
await loadData();
}

function clearForm(){
editId="";
imageBase64="";
document.getElementById("dt-name").value="";
document.getElementById("dt-address").value="";
document.getElementById("dt-map").value="";
document.getElementById("dt-video").value="";
document.getElementById("dt-image-file").value="";
setHtml("dt-editor","");
const img=document.getElementById("dt-preview");
img.removeAttribute("src");
img.style.display="none";
}