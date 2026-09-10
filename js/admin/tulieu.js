//======================================================
// HIENLUONG WEBSITE
// File : /js/admin/tulieu.js
//======================================================

import { readData } from "../../scripts/firebaseService.js";
import{showVideo,showMap,hideMedia}from "../components/floatingmedia.js";
console.log("📚 TƯ LIỆU LOADED");

//======================================================

let LIST = [];

let CURRENT = null;

//======================================================
// INIT THUMBNAIL
//======================================================

export async function initThumbnail(){

    console.log("🚀 TƯ LIỆU INIT");

    await loadData();

    if(!LIST.length){
        return;
    }

    renderThumbnail();

}

//======================================================
// LOAD DATA
//======================================================

async function loadData(){

    LIST = [];

    CURRENT = null;

    try{

        const data = await readData("admin/tulieu");

        if(!data){
            return;
        }

        LIST = Object.entries(data).map(([id,item])=>({

            id,

            ...item

        }));

        sortData();

        CURRENT = LIST[0];

        console.log("📚 TƯ LIỆU =",LIST);

    }
    catch(err){

        console.error(err);

        LIST = [];

        CURRENT = null;

    }

}

//======================================================
// SORT DATA
//======================================================

function sortData(){

    LIST.sort((a,b)=>{

        return (b.updated_at || 0) - (a.updated_at || 0);

    });

}

//======================================================
// RENDER THUMBNAIL
//======================================================

function renderThumbnail(){

    const menu = document.querySelector(
        '.hl-menu[data-page="tulieu"]'
    );

    if(!menu || !CURRENT){
        return;
    }

    const thumb = menu.querySelector(".hl-thumb");

    if(!thumb){
        return;
    }

    thumb.innerHTML = "";

    thumb.style.backgroundImage = "";

    if(CURRENT.image){

        thumb.style.backgroundImage =
        `url("${CURRENT.image}")`;

    }

    thumb.onclick = function(e){

        e.stopPropagation();

        toggleList();

    };

}

//======================================================
// TOGGLE LIST
//======================================================

function toggleList(){

    const menu = document.querySelector(
        '.hl-menu[data-page="tulieu"]'
    );

    if(!menu){
        return;
    }

    let list = menu.querySelector(".hl-tulieu-menu");

    // Đang mở thì đóng

    if(list){

        list.remove();

        return;

    }

    // Tạo danh sách

    list = document.createElement("div");

    list.className = "hl-tulieu-menu";

    LIST.forEach(item=>{

        list.innerHTML += `

        <div
        class="hl-tulieu-row"
        data-id="${item.id}"
        title="${item.title || ""}">

            <div class="hl-tulieu-row-icon">
                📚
            </div>

            <div class="hl-tulieu-row-title">
                ${item.title || ""}
            </div>

        </div>

        `;

    });

    menu.appendChild(list);

    bindListEvent();

}


//======================================================
// RENDER MAIN
//======================================================

export function renderMain(){

const box = document.getElementById("hl-content");

if(!box){
return;
}

const bg = document.getElementById("bg-main");

if(bg){
bg.style.display = "none";
}

hideMedia();

if(!CURRENT){

box.innerHTML=`
<div class="hl-empty">
Chưa có dữ liệu tư liệu.
</div>
`;

return;

}

box.innerHTML=`

<div class="hl-tulieu">

<h2 class="hl-tulieu-title">
${CURRENT.title||""}
</h2>

${CURRENT.type?`
<div class="hl-tulieu-type">
<b>📚 Loại tư liệu:</b>
${CURRENT.type}
</div>
`:""}

${CURRENT.image?`
<div class="hl-tulieu-image">
<img src="${CURRENT.image}">
</div>
`:""}

${CURRENT.source?`
<div class="hl-tulieu-source">
<b>📖 Nguồn:</b>
${CURRENT.source}
</div>
`:""}

${CURRENT.author?`
<div class="hl-tulieu-author">
<b>✍ Tác giả:</b>
${CURRENT.author}
</div>
`:""}

${CURRENT.link?`
<div class="hl-tulieu-link">
<a
href="#"
class="btn-link">
🔗 Xem tư liệu
</a>
</div>
`:""}

<div class="hl-tulieu-content">
${CURRENT.content||""}
</div>

</div>

`;

//=============================
// LINK
//=============================

const btn = box.querySelector(".btn-link");

if(btn){

btn.onclick=function(e){

e.preventDefault();

const url = CURRENT.link || "";

if(
url.includes("youtube.com") ||
url.includes("youtu.be") ||
url.includes("drive.google.com")
){

showVideo(url);

}
else{

window.open(url,"_blank");

}

};

}

}

//======================================================
// BIND LIST EVENT
//======================================================

function bindListEvent(){

document
.querySelectorAll(".hl-tulieu-row")
.forEach(row=>{

row.onclick=function(e){

e.stopPropagation();

const id=this.dataset.id;

CURRENT=LIST.find(
item=>item.id===id
);

document
.querySelectorAll(".hl-tulieu-row")
.forEach(r=>r.classList.remove("active"));

this.classList.add("active");

renderMain();

};

});

}