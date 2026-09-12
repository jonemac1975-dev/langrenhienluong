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
    catch(err){console.error(err);
        DATA = null;
    }
}

//======================================================
// RENDER THUMBNAIL
//======================================================

function renderThumbnail(){

    const thumb =
        document.querySelector(
            '.hl-menu[data-page="gioithieu"] .hl-thumb'
        );

    if(!thumb || !DATA){
        return;
    }

    thumb.innerHTML = "";

    thumb.style.backgroundImage = "";

    if(DATA.image){

        thumb.style.backgroundImage =
            `url("${DATA.image}")`;
    }

    bindThumbnail();
}

//======================================================
// BIND THUMBNAIL
//======================================================

function bindThumbnail(){

    const thumb =
        document.querySelector(
            '.hl-menu[data-page="gioithieu"] .hl-thumb'
        );

    if(!thumb){
        return;
    }

    thumb.onclick = function(e){

        e.stopPropagation();

        renderMain();
    };
}

//======================================================
// RENDER MAIN
//======================================================

export function renderMain(){

    const box =
        document.getElementById("hl-content");

    if(!box){
        return;
    }

    const bg =
        document.getElementById("bg-main");

    if(bg){
        bg.style.display = "none";
    }

    if(!DATA){

        box.innerHTML = `
            <div class="hl-empty">
                Chưa có dữ liệu giới thiệu.
            </div>
        `;

        return;
    }

    const videoHtml =
        DATA.video
        ?
        `
        <div class="hl-gioithieu-video">
            ${renderVideo(DATA.video)}
        </div>
        `
        :
        "";

    box.innerHTML = `

    <div class="hl-gioithieu">

        ${DATA.image ? `
        <div class="hl-gioithieu-image">
            <img src="${DATA.image}" alt="Hiền Lương">
        </div>
        ` : ""}

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