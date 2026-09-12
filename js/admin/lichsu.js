//======================================================
// HIENLUONG WEBSITE
// File : /js/admin/lichsu.js
//======================================================

import { readData } from "../../scripts/firebaseService.js";
import { renderVideo } from "../../scripts/services/videoService.js";

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
        const data = await readData("admin/lichsu");
        if(!data){
            return;
        }

        LIST = Object.entries(data).map(([id,item])=>({id,...item}));
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
        const ay = Number(a.year)||0;
        const by = Number(b.year)||0;
        if(by!==ay){
            return by-ay;
        }

        return (
            (b.updated_at||0) -
            (a.updated_at||0)
        );
    });
}

//======================================================
// RENDER THUMBNAIL
//======================================================

function renderThumbnail(){

    const menu = document.querySelector('.hl-menu[data-page="lichsu"]');
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
        thumb.style.backgroundImage = `url("${CURRENT.image}")`;
    }
    
}

//======================================================
// TOGGLE LIST
//======================================================

function toggleList(){

    const menu = document.querySelector('.hl-menu[data-page="lichsu"]');
    if(!menu){
        return;
    }
    let list = menu.querySelector(".hl-history-menu");

    //==================================================
    // ĐANG MỞ → ĐÓNG
    //==================================================

    if(list){
        list.remove();
        return;
    }

    //==================================================
    // TẠO DANH SÁCH
    //==================================================

    list = document.createElement("div");
    list.className = "hl-history-menu";
    LIST.forEach(item=>{
        list.innerHTML += `
            <div
                class="hl-history-row"
                data-id="${item.id}"
                title="${item.year || ""} - ${item.title || ""}"
            >
                <div class="hl-history-row-year">
                    ${item.year || ""}
                </div>

                <div class="hl-history-row-title">
                    ${item.title || ""}
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

    if(!CURRENT){
        box.innerHTML = `
            <div class="hl-empty">
                Chưa có dữ liệu lịch sử.
            </div>
        `;
        return;
    }

    const videoHtml =
        CURRENT.video
        ?
        `
        <div class="hl-lichsu-video">
            ${renderVideo(CURRENT.video)}
        </div>
        `
        :
        "";

    box.innerHTML = `
        <div class="hl-lichsu">
            <div class="hl-lichsu-year">
                ${CURRENT.year || ""}
            </div>

            <h2 class="hl-lichsu-title">
                ${CURRENT.title || ""}
            </h2>

            ${
                CURRENT.image
                ?
                `
                <div class="hl-lichsu-image">
                    <img
                        src="${CURRENT.image}"
                        alt="${CURRENT.title || "Lịch sử Hiền Lương"}"
                    >
                </div>
                `
                :
                ""
            }

            ${videoHtml}

            ${
                CURRENT.source
                ?
                `
                <div class="hl-lichsu-source">
                    <b>Nguồn tư liệu:</b>
                    ${CURRENT.source}
                </div>
                `
                :
                ""
            }
            <div class="hl-lichsu-content">
                ${CURRENT.content || ""}
            </div>
        </div>

    `;
}

//======================================================
// BIND LIST EVENT
//======================================================

function bindListEvent(){

    document
        .querySelectorAll(".hl-history-row")
        .forEach(row=>{
            row.onclick = function(e){
                e.stopPropagation();
                const id = this.dataset.id;
                CURRENT = LIST.find(item =>item.id === id);
                document
                    .querySelectorAll(
                        ".hl-history-row"
                    )
                    .forEach(r =>
                        r.classList.remove(
                            "active"
                        )
                    );
                this.classList.add("active");
                renderMain();
            };
        });
}