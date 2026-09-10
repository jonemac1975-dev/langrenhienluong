//======================================================
// HIENLUONG WEBSITE
// File : admin/js/danhthang.js
//======================================================

import{readData,writeData}from "../../scripts/firebaseService.js";
import{createEditor,getHtml,setHtml}from "../../js/editor.js";

let DATA={};
let editId="";
let imageBase64="";

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

function loadImage(e){
const file=e.target.files[0];
if(!file)return;
const reader=new FileReader();
reader.onload=()=>{
imageBase64=reader.result;
const img=document.getElementById("dd-preview");
img.src=imageBase64;
img.style.display="block";
};
reader.readAsDataURL(file);
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
if(editId==="")editId="dd"+Date.now();
DATA[editId]={
name,
address,
map,
video,
content,
image:imageBase64,
updated_at:Date.now()
};
await writeData("admin/diadanh",DATA);
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
delete DATA[id];
await writeData("admin/diadanh",DATA);
await loadData();
}

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