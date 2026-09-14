import{readData,writeData,removeData}from "../../scripts/firebaseService.js";
import{createEditor,getHtml,setHtml}from "../../js/editor.js";
import{compressImage}from "../../scripts/compressImage.js";

let DATA={};
let editId="";
let imageBase64="";

export async function init(){
createEditor("ls-editor");
bindEvents();
await loadData();
}

function bindEvents(){
document.getElementById("ls-image-file").onchange=loadImage;
document.getElementById("btn-ls-save").onclick=saveData;
}

async function loadData(){
DATA=await readData("admin/lichsu")||{};
renderTable();
}

function renderTable(){
const body=document.getElementById("ls-body");
body.innerHTML="";
let stt=1;

Object.keys(DATA).sort().forEach(id=>{
const r=DATA[id];

body.innerHTML+=`
<tr>
<td>${stt++}</td>
<td>${r.year||""}</td>
<td>${r.title||""}</td>
<td>${r.source||""}</td>
<td>${r.video ? "🎥 Có" : "-"}</td>
<td>
<button onclick="window.editLichSu('${id}')">Sửa</button>
<button onclick="window.deleteLichSu('${id}')">Xóa</button>
</td>
</tr>`;
});
}

async function loadImage(e){
const file=e.target.files[0];
if(!file)return;

try{

imageBase64=await compressImage(file,"image");

const img=document.getElementById("ls-preview");

img.src=imageBase64;
img.style.display="block";

console.log("Ảnh sau nén:");
console.log("Base64:",imageBase64.length,"ký tự");

}catch(error){

console.error(error);

alert(
error.message||
"Không thể xử lý ảnh."
);

}
}


async function saveData(){
const year=document.getElementById("ls-year").value.trim();
const title=document.getElementById("ls-title").value.trim();
const content=getHtml("ls-editor");
const source=document.getElementById("ls-source").value.trim();
const video=document.getElementById("ls-video").value.trim();

if(year===""||title===""){
alert("Nhập năm và tiêu đề.");
return;
}

if(editId==="")editId="ls"+Date.now();

DATA[editId]={
year,
title,
content,
source,
video,
image:imageBase64,
updated_at:Date.now()
};

await writeData("admin/lichsu",DATA);

alert("Đã lưu.");

clearForm();
await loadData();
}

window.editLichSu=function(id){
const r=DATA[id];

if(!r)return;

editId=id;
imageBase64=r.image||"";

document.getElementById("ls-year").value=r.year||"";
document.getElementById("ls-title").value=r.title||"";
document.getElementById("ls-source").value=r.source||"";
document.getElementById("ls-video").value=r.video||"";

setHtml("ls-editor",r.content||"");

const img=document.getElementById("ls-preview");

if(imageBase64){
img.src=imageBase64;
img.style.display="block";
}else{
img.style.display="none";
}

window.scrollTo({
top:0,
behavior:"smooth"
});
};

window.deleteLichSu=async function(id){
if(!confirm("Xóa sự kiện này?"))return;

delete DATA[id];

await writeData("admin/lichsu",DATA);

await loadData();
};

function clearForm(){
editId="";
imageBase64="";

document.getElementById("ls-year").value="";
document.getElementById("ls-title").value="";
document.getElementById("ls-source").value="";
document.getElementById("ls-video").value="";
document.getElementById("ls-image-file").value="";

setHtml("ls-editor","");

const img=document.getElementById("ls-preview");

img.removeAttribute("src");
img.style.display="none";
}