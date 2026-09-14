
//======================================================
// HIENLUONG WEBSITE
// File : /js/admin/gioithieu.js
//======================================================

import { readData } from "../../scripts/firebaseService.js";
import { renderVideo } from "../../scripts/services/videoService.js";

//======================================================

let DATA = null;

//======================================================
// INIT THUMBNAIL
//======================================================

export async function initThumbnail(){
    await loadData();
    renderThumbnail();
}

//======================================================
// LOAD DATA
//======================================================

async function loadData(){
    try{

        DATA = await readData("admin/gioithieu");
    }
    catch(err){
        console.error("❌ LOAD GIỚI THIỆU ERROR:",err);
        DATA = null;
    }
}

//======================================================
// RENDER THUMBNAIL
//======================================================

function renderThumbnail(){
    const thumb = document.querySelector('.hl-menu[data-page="gioithieu"] .hl-thumb');
    if(!thumb || !DATA){
        return;
    }
    thumb.innerHTML = "";
    if(DATA.image){
        const img = document.createElement("img");
        img.src = DATA.image;
        img.alt = DATA.title || "Giới thiệu Hiền Lương";
        img.style.display = "block";
        img.style.width = "100%";
        img.style.height = "auto";
        img.style.maxWidth = "100%";
        img.style.objectFit = "contain";
        img.style.objectPosition = "center";
        img.style.margin = "0";
        img.style.padding = "0";
        thumb.appendChild(img);
    }
    bindThumbnail();
}

//======================================================
// BIND THUMBNAIL
//======================================================

function bindThumbnail(){
    const thumb = document.querySelector('.hl-menu[data-page="gioithieu"] .hl-thumb');
    if(!thumb){
        return;
    }
    thumb.onclick = function(e){e.stopPropagation();
            renderMain();
       };
}

//======================================================
// RENDER MAIN
//======================================================

export async function renderMain(){

    const box = document.getElementById("hl-content");
    if(!box){
        return;
    }

    //==================================================
    // LAZY LOAD DATA
    // Trước đây DATA được load từ initThumbnail()
    // khi INDEX khởi động.
    // Bây giờ module chỉ được load khi click.
    // Vì vậy renderMain() phải tự đọc dữ liệu.
    //==================================================

    box.innerHTML = `<div class="hl-loading">Đang tải Giới thiệu...</div>`;
    await loadData();

    //==================================================
    // ẨN BACKGROUND
    //==================================================

    const bg = document.getElementById("bg-main");
    if(bg){
        bg.style.display = "none";
    }

    //==================================================
    // KHÔNG CÓ DỮ LIỆU
    //==================================================

    if(!DATA){

        box.innerHTML = `<div class="hl-empty">Chưa có dữ liệu giới thiệu.</div>`;
        return;
    }

    //==================================================
    // VIDEO
    //==================================================

    const videoHtml = DATA.video ?`<div class="hl-gioithieu-video">${renderVideo(DATA.video)}</div>`:"";

    //==================================================
    // RENDER
    //==================================================

    box.innerHTML = `
        <div class="hl-gioithieu">
            ${
                DATA.image
                ?
                `
                <div class="hl-gioithieu-image">
                    <img
                        src="${DATA.image}"
                        alt="Hiền Lương">
                </div>
                `
                :
                ""
            }
            <div class="hl-gioithieu-body">
                <h2 class="hl-gioithieu-title">
                    ${DATA.title || ""}
                </h2>
                ${videoHtml}
                <div class="hl-gioithieu-content">
                    ${DATA.content || ""}
                </div>
            </div>
        </div>
    `;
}
