//======================================================
// HIENLUONG WEBSITE
// File : editor.js
//======================================================
import{compressImage}from "../scripts/compressImage.js";

export function createEditor(id){
const box=document.getElementById(id);
if(!box) return;
box.innerHTML=`
<div class="ed-toolbar">
<button data-cmd="bold"><b>B</b></button>
<button data-cmd="italic"><i>I</i></button>
<button data-cmd="underline"><u>U</u></button>
<button data-tag="h1">H1</button>
<button data-tag="h2">H2</button>
<button data-tag="h3">H3</button>
<button data-cmd="insertUnorderedList">•</button>
<button data-cmd="insertOrderedList">1.</button>
<button id="ed-link">🔗</button>
<button id="ed-image">🖼</button>
<button id="ed-clear">🧹</button>
<button id="ed-html">&lt;/&gt;</button>
<button id="ed-preview">👁</button>
</div>
<div
class="ed-content"
contenteditable="true">
</div>
`;

const editor=box.querySelector(".ed-content");

//======================================================
// COMMAND
//======================================================

box.querySelectorAll("[data-cmd]").forEach(btn=>{btn.onclick=()=>{document.execCommand(btn.dataset.cmd,false,null);
editor.focus();
};
});
box.querySelectorAll("[data-tag]").forEach(btn=>{btn.onclick=()=>{document.execCommand("formatBlock",false,btn.dataset.tag);
editor.focus();
};
});

//======================================================
// HTML View
//======================================================
let htmlMode=false;
box.querySelector("#ed-html").onclick=()=>{
const ed=box.querySelector(".ed-content");
if(!htmlMode){
ed.textContent=ed.innerHTML;
htmlMode=true;
}else{ed.innerHTML=ed.textContent;
htmlMode=false;
}
};

//======================================================
// PREVIEW
//======================================================

box.querySelector("#ed-preview").onclick=()=>{const win=window.open("","preview");
win.document.write(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Xem trước</title>

<style>

body{
margin:0;
font-family:Arial,sans-serif;
background:#f4f4f4;
}

.preview-header{
position:sticky;
top:0;
display:flex;
justify-content:space-between;
align-items:center;
padding:12px 20px;
background:#2563eb;
color:#fff;
box-shadow:0 2px 8px rgba(0,0,0,.2);
z-index:1000;
}

.preview-header h3{
margin:0;
font-size:18px;
}

.preview-header button{
padding:8px 18px;
border:none;
border-radius:5px;
background:#fff;
color:#2563eb;
font-weight:bold;
cursor:pointer;
}

.preview-header button:hover{
background:#e5e7eb;
}

.preview-content{
max-width:900px;
margin:20px auto;
padding:25px;
background:#fff;
border-radius:8px;
box-shadow:0 2px 10px rgba(0,0,0,.1);
line-height:1.8;
}

.preview-content img{
display:block;
max-width:100%;
margin:15px auto;
}

.preview-content table{
border-collapse:collapse;
width:100%;
margin:15px 0;
}

.preview-content td,
.preview-content th{
border:1px solid #bbb;
padding:8px;
}

</style>
</head>
<body>
<div class="preview-header">
<h3>👁 Xem trước nội dung</h3>
<div>
<button onclick="window.focus();window.close();">
❌ Đóng
</button>
</div>
</div>
<div class="preview-content">
${editor.innerHTML}
</div>
</body>
</html>
`);

win.document.close();

//};

};
//======================================================
// LINK
//======================================================

box.querySelector("#ed-link").onclick=()=>{
const url=prompt("Link");
if(url)
document.execCommand(
"createLink",
false,
url
);
};

//======================================================
// IMAGE FROM PC
// NÉN ẢNH TRƯỚC KHI CHÈN VÀO NỘI DUNG
//======================================================

box.querySelector("#ed-image").onclick=()=>{
const input=document.createElement("input");
input.type="file";
input.accept="image/*";
input.onchange=async e=>{const file=e.target.files[0];
if(!file)return;
try{

const imageBase64=await compressImage(file,"image");
editor.focus();

document.execCommand("insertImage",false,imageBase64);
console.log("Ảnh trong nội dung sau nén:",imageBase64.length,"ký tự Base64");
}catch(error){
console.error(error);

alert(error.message||"Không thể xử lý ảnh.");
}
};
input.click();
};

//======================================================
// CLEAR
//======================================================

box.querySelector("#ed-clear").onclick=()=>{document.execCommand("removeFormat");
};

//======================================================
// PASTE WORD - GIỮ FORMAT WORD
//======================================================

editor.addEventListener("paste",e=>{
e.preventDefault();
let html=e.clipboardData.getData("text/html");
if(html){
const temp=document.createElement("div");
temp.innerHTML=html;


// Xóa comment Word

temp.innerHTML=temp.innerHTML.replace(/<!--[\s\S]*?-->/g,"");

// Xóa tag rác Office

temp.querySelectorAll("meta,link,xml,style,script").forEach(el=>el.remove());


// Xóa thuộc tính không cần thiết
// nhưng giữ style để bảo toàn format

temp.querySelectorAll("*")
.forEach(el=>{
el.removeAttribute("id");
el.removeAttribute("lang");
el.removeAttribute("xmlns");
});


// Xử lý tag Word

let clean=temp.innerHTML;

// bỏ namespace Word

clean=clean.replace(/<\/?o:[^>]*>/gi,"");


// bỏ mso rác trong style
// nhưng giữ màu, font, border

clean=clean.replace(/mso-[^:;]+:[^;"]+;?/gi,"");

// Chèn vào vị trí con trỏ

editor.focus();

document.execCommand("insertHTML",false,clean);
}
else{

const text=e.clipboardData.getData("text/plain");
document.execCommand("insertText",false,text);
}
});
}
//======================================================

export function getHtml(id){
return document
.querySelector(
`#${id} .ed-content`
)?.innerHTML||"";
}

//======================================================

export function setHtml(id,html){
const ed=document.querySelector(
`#${id} .ed-content`
);
if(ed)
ed.innerHTML=html;
}

//======================================================

export function clearEditor(id){
setHtml(id,"");

}