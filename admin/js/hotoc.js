//======================================================
// HIENLUONG WEBSITE
// File : admin/js/hotoc.js
//======================================================

import{readData,writeData}from "../../scripts/firebaseService.js";
import{createEditor,getHtml,setHtml}from "../../js/editor.js";
import{compressImage}from "../../scripts/compressImage.js";

let DATA={};
let editId="";
let imageBase64="";

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

imageBase64=
await compressImage(
file,
"image"
);

const img=
document.getElementById(
"ht-preview"
);

img.src=imageBase64;
img.style.display="block";

console.log(
"Ảnh họ tộc sau nén:",
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
const name=document.getElementById("ht-name").value.trim();
const map=document.getElementById("ht-map").value.trim();
const web=document.getElementById("ht-web").value.trim();
const content=getHtml("ht-editor");

if(name===""){
alert("Nhập tên họ tộc.");
return;
}

if(editId==="")editId="ht"+Date.now();

DATA[editId]={
name,
content,
map,
web,
image:imageBase64,
updated_at:Date.now()
};

await writeData("admin/hotoc",DATA);
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
delete DATA[id];
await writeData("admin/hotoc",DATA);
await loadData();
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