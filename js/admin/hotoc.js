//======================================================
// HIENLUONG WEBSITE
// File : /js/admin/hotoc.js
//======================================================

import { readData } from "../../scripts/firebaseService.js";
import {showMap,hideMedia} from "../components/floatingmedia.js";
console.log("👪 HỌ TỘC LOADED");

//======================================================

let LIST = [];

let CURRENT = null;

//======================================================
// INIT THUMBNAIL
//======================================================

export async function initThumbnail(){

    console.log("🚀 HỌ TỘC INIT");

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

        const data = await readData("admin/hotoc");

        if(!data){
            return;
        }

        LIST = Object.entries(data).map(([id,item])=>({

            id,

            ...item

        }));

        sortData();

        CURRENT = LIST[0];

        console.log("👪 HỌ TỘC =",LIST);

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
        '.hl-menu[data-page="hotoc"]'
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
        '.hl-menu[data-page="hotoc"]'
    );

    if(!menu){
        return;
    }

    let list = menu.querySelector(".hl-hotoc-menu");

    // Đang mở thì đóng

    if(list){

        list.remove();

        return;

    }

    // Tạo danh sách

    list = document.createElement("div");

    list.className = "hl-hotoc-menu";

    LIST.forEach(item=>{

        list.innerHTML += `

        <div
        class="hl-hotoc-row"
        data-id="${item.id}"
        title="${item.name || ""}">

            <div class="hl-hotoc-row-icon">
                👪
            </div>

            <div class="hl-hotoc-row-title">
                ${item.name || ""}
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

// Đổi bài thì đóng media cũ

hideMedia();

if(!CURRENT){

box.innerHTML=`
<div class="hl-empty">
Chưa có dữ liệu họ tộc.
</div>
`;

return;

}

box.innerHTML=`

<div class="hl-hotoc">

<h2 class="hl-hotoc-title">
${CURRENT.name||""}
</h2>

${CURRENT.image?`
<div class="hl-hotoc-image">
<img src="${CURRENT.image}">
</div>
`:""}

${CURRENT.web?`
<div class="hl-hotoc-web">
<b>🌐 Website gia phả:</b>
<a
href="${CURRENT.web}"
target="_blank">
Xem Website
</a>
</div>
`:""}

${CURRENT.map?`
<div class="hl-hotoc-map">
<a
href="#"
class="btn-map">
🗺 Xem Google Maps
</a>
</div>
`:""}

<div class="hl-hotoc-content">
${CURRENT.content||""}
</div>

</div>

`;

//=============================
// BUTTON MAP
//=============================

const btnMap = box.querySelector(".btn-map");

if(btnMap){

btnMap.onclick = function(e){

e.preventDefault();

showMap(CURRENT.map);

};

}

}

//======================================================
// BIND LIST EVENT
//======================================================

function bindListEvent(){

document
.querySelectorAll(".hl-hotoc-row")
.forEach(row=>{

row.onclick=function(e){

e.stopPropagation();

const id=this.dataset.id;

CURRENT=LIST.find(
item=>item.id===id
);

document
.querySelectorAll(".hl-hotoc-row")
.forEach(r=>r.classList.remove("active"));

this.classList.add("active");

renderMain();

};

});

}