//======================================================
// HIENLUONG WEBSITE
// File : /js/admin/danhthang.js
//======================================================

import { readData } from "../../scripts/firebaseService.js";
import{showVideo,showMap,hideMedia}from "../components/floatingmedia.js";

//======================================================

let LIST = [];
let CURRENT = null;

//======================================================
// INIT THUMBNAIL
//======================================================

export async function initThumbnail(){
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

        const data = await readData("admin/diadanh");
        if(!data){
            return;
        }
        LIST = Object.entries(data).map(([id,item])=>({
            id,
            ...item
        }));
        sortData();
        CURRENT = LIST[0];
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
        return (b.updated_at||0) - (a.updated_at||0);
    });
}


//======================================================
// RENDER THUMBNAIL
//======================================================

function renderThumbnail(){

    const menu = document.querySelector('.hl-menu[data-page="diadanh"]');
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
    }

//======================================================
// TOGGLE LIST
//======================================================

function toggleList(){
    const menu = document.querySelector('.hl-menu[data-page="diadanh"]');
    if(!menu){
        return;
    }

    let list = menu.querySelector(".hl-diadanh-menu");

    // Đang mở thì đóng

    if(list){

        list.remove();

        return;

    }

    // Tạo danh sách

    list = document.createElement("div");

    list.className = "hl-diadanh-menu";

    LIST.forEach(item=>{

        list.innerHTML += `

        <div
        class="hl-diadanh-row"
        data-id="${item.id}"
        title="${item.name || ""}">

            <div class="hl-diadanh-row-icon">
                🏞
            </div>

            <div class="hl-diadanh-row-title">
                ${item.name || ""}
            </div>

        </div>

        `;

    });

    menu.appendChild(list);

    bindListEvent();

}

//======================================================
// menuClick
//======================================================
export function menuClick(){
    toggleList();
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
Chưa có dữ liệu địa danh.
</div>
`;

return;

}

box.innerHTML=`

<div class="hl-diadanh">

<h2 class="hl-diadanh-title">
${CURRENT.name||""}
</h2>

${CURRENT.image?`
<div class="hl-diadanh-image">
<img src="${CURRENT.image}">
</div>
`:""}

${CURRENT.address?`
<div class="hl-diadanh-address">
<b>📍 Địa chỉ:</b>
${CURRENT.address}
</div>
`:""}

${CURRENT.map?`
<div class="hl-diadanh-map">
<a
href="#"
class="btn-map">
🗺 Xem Google Maps
</a>
</div>
`:""}

${CURRENT.video?`
<div class="hl-diadanh-video">
<a
href="#"
class="btn-video">
🎬 Xem Video
</a>
</div>
`:""}

<div class="hl-diadanh-content">
${CURRENT.content||""}
</div>

</div>

`;

//=============================
// BUTTON VIDEO
//=============================

const btnVideo=box.querySelector(".btn-video");

if(btnVideo){

btnVideo.onclick=function(e){

e.preventDefault();

showVideo(CURRENT.video);

};

}

//=============================
// BUTTON MAP
//=============================

const btnMap=box.querySelector(".btn-map");

if(btnMap){

btnMap.onclick=function(e){

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
    .querySelectorAll(".hl-diadanh-row")
    .forEach(row=>{

        row.onclick = function(e){

            e.stopPropagation();

            const id = this.dataset.id;

            CURRENT = LIST.find(
                item=>item.id===id
            );

            document
            .querySelectorAll(".hl-diadanh-row")
            .forEach(r=>r.classList.remove("active"));

            this.classList.add("active");

            renderMain();

        };

    });

}