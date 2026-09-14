//======================================================
// HIENLUONG WEBSITE
// File : /js/admin/lichsu.js
// Tối ưu: cache dữ liệu + chống đọc Firebase dư
//======================================================

import { readData } from "../../scripts/firebaseService.js";
import { renderVideo } from "../../scripts/services/videoService.js";

//======================================================

let LIST = [];
let CURRENT = null;
let DATA_LOADED_AT = 0;
let DATA_LOADING = null;
const DATA_CACHE_TIME = 60000;

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

async function loadData(force = false){
    const now = Date.now();

    //==================================================
    // CACHE CÒN HẠN
    //==================================================

    if(
        !force &&
        DATA_LOADED_AT &&
        (now - DATA_LOADED_AT) < DATA_CACHE_TIME
    ){

        return LIST;
    }

    //==================================================
    // ĐANG LOAD
    //==================================================

    if(DATA_LOADING){
        return DATA_LOADING;
    }

    //==================================================
    // LOAD FIREBASE
    //==================================================

    DATA_LOADING = (async () => {
        try{
            const data = await readData("admin/lichsu");
            if(!data){
                LIST = [];
                CURRENT = null;
                DATA_LOADED_AT = Date.now();
                return LIST;
            }

            LIST =
                Object.entries(data)
                    .map(
                        ([id, item]) => ({
                            id,
                            ...item
                        })
                    );
            sortData();
            CURRENT = LIST[0] || null;
            DATA_LOADED_AT = Date.now();
           return LIST;

        }
        catch(err){
            console.error("❌ LOAD LỊCH SỬ ERROR:",err);
            LIST = [];
            CURRENT = null;
            DATA_LOADED_AT = 0;
            return LIST;
        }
        finally{
            DATA_LOADING = null;
        }
    })();
    return DATA_LOADING;
}

//======================================================
// SORT DATA
//======================================================

function sortData(){
    LIST.sort(
        (a,b) => {
            const ay = Number(a.year) || 0;
            const by = Number(b.year) || 0;
            if(by !== ay){
                return by - ay;
            }

            return (
                (b.updated_at || 0) -
                (a.updated_at || 0)
            );
        }
    );
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
    if(CURRENT.image){
        const img = document.createElement("img");
        img.src = CURRENT.image;
        img.alt = CURRENT.title || "Lịch sử Hiền Lương";
        img.loading = "lazy";
        img.decoding = "async";
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
}

//======================================================
// TOGGLE LIST
//======================================================

function toggleList(){

    let menu;

    //==================================================
    // MOBILE
    //==================================================

    if(
        window.matchMedia("(max-width: 768px)").matches
    ){

        menu = document.querySelector('.mobile-menu-item[data-page="lichsu"]');
    }

    //==================================================
    // DESKTOP
    //==================================================

    else{
        menu = document.querySelector('.hl-menu[data-page="lichsu"]');
    }

    if(!menu){
        return;
    }

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
    LIST.forEach(
        item => {
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

        }
    );

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
        bg.style.display ="none";
    }

    if(!CURRENT){
        box.innerHTML = `<div class="hl-empty"> Chưa có dữ liệu lịch sử.</div>`;
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
                        decoding="async"
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
        .querySelectorAll(
            ".hl-history-row"
        )
        .forEach(
            row => {

                row.onclick =
                    function(e){

                        e.stopPropagation();

                        const id =
                            this.dataset.id;

                        CURRENT =
                            LIST.find(
                                item =>
                                    item.id === id
                            );

                        document
                            .querySelectorAll(
                                ".hl-history-row"
                            )
                            .forEach(
                                r =>
                                    r.classList.remove(
                                        "active"
                                    )
                            );

                        this.classList.add(
                            "active"
                        );

	                        renderMain();
                    };

            }
        );
}