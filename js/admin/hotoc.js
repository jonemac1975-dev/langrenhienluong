//======================================================
// HIENLUONG WEBSITE
// File : /js/admin/hotoc.js
// Tối ưu: cache dữ liệu + chống đọc Firebase dư
//======================================================

import {readData} from "../../scripts/firebaseService.js";
import {showMap,hideMedia} from "../components/floatingmedia.js";

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
    if(
        !force &&
        DATA_LOADED_AT &&
        (now - DATA_LOADED_AT) < DATA_CACHE_TIME
    ){
        return LIST;
    }
    if(DATA_LOADING){
        return DATA_LOADING;
    }
    DATA_LOADING = (async () => {
        try{
            const data = await readData( "admin/hotoc");
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
            console.error("❌ LOAD HỌ TỘC ERROR:", err);
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
        (a, b) => {
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

    const menu = document.querySelector('.hl-menu[data-page="hotoc"]');
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
        img.alt = CURRENT.title || CURRENT.name || "Họ tộc Hiền Lương";
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
if(window.matchMedia("(max-width: 768px)").matches){
    menu = document.querySelector('.mobile-menu-item[data-page="hotoc"]');
}else{
    menu = document.querySelector('.hl-menu[data-page="hotoc"]');
}

if(!menu){
    console.warn("⚠️ KHÔNG TÌM THẤY MENU HỌ TỘC");
    return;
}
    if(!menu){
        return;
    }
    let list = menu.querySelector(".hl-hotoc-menu");

    //==================================================
    // ĐANG MỞ THÌ ĐÓNG
    //==================================================

    if(list){
        list.remove();
        return;
    }

    //==================================================
    // TẠO DANH SÁCH
    //==================================================

    list = document.createElement("div");
    list.className ="hl-hotoc-menu";
    LIST.forEach(
        item => {
            list.innerHTML += `
                <div
                    class="hl-hotoc-row"
                    data-id="${item.id}"
                    title="${item.name || ""}"
                >
                    <div class="hl-hotoc-row-icon">
                        👪
                    </div>
                    <div class="hl-hotoc-row-title">
                        ${item.name || ""}
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
        bg.style.display = "none";
    }

    // Đổi bài thì đóng media cũ

    hideMedia();
    if(!CURRENT){
        box.innerHTML = `<div class="hl-empty">Chưa có dữ liệu họ tộc.</div>`;
        return;
    }
    box.innerHTML = `
        <div class="hl-hotoc">
            <h2 class="hl-hotoc-title">
                ${CURRENT.name || ""}
            </h2>
            ${
                CURRENT.image
                ?
                `
                <div class="hl-hotoc-image">
                    <img
                        src="${CURRENT.image}"
                        alt="${CURRENT.name || "Họ tộc Hiền Lương"}"
                        decoding="async"
                    >
                </div>
                `
                :
                ""
            }
            ${
                CURRENT.web
                ?
                `
                <div class="hl-hotoc-web">
                    <b>🌐 Website gia phả:</b>
                    <a
                        href="${CURRENT.web}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Xem Website
                    </a>

                </div>
                `
                :
                ""
            }

            ${
                CURRENT.map
                ?
                `
                <div class="hl-hotoc-map">

                    <a
                        href="#"
                        class="btn-map"
                    >
                        🗺 Xem Google Maps
                    </a>

                </div>
                `
                :
                ""
            }

            <div class="hl-hotoc-content">
                ${CURRENT.content || ""}
            </div>
        </div>
    `;

    //==================================================
    // BUTTON MAP
    //==================================================

    const btnMap = box.querySelector(".btn-map");
    if(btnMap){
        btnMap.onclick =
            function(e){
                e.preventDefault();
                showMap(
                    CURRENT.map
                );
            };
    }
}

//======================================================
// BIND LIST EVENT
//======================================================

function bindListEvent(){

    document
        .querySelectorAll(
            ".hl-hotoc-row"
        )
        .forEach(
            row => {
                row.onclick =
                    function(e){
                        e.stopPropagation();
                        const id = this.dataset.id;
                        CURRENT = LIST.find(item =>item.id === id);
                        document
                            .querySelectorAll(
                                ".hl-hotoc-row"
                            )
                            .forEach(
                                r =>
                                    r.classList.remove(
                                        "active"
                                    )
                            );

                        this.classList.add("active");
                        renderMain();
                    };
            }
        );
}