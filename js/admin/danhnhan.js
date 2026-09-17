//======================================================
// HIENLUONG WEBSITE
// File : /js/admin/amthuc.js
// Tối ưu: cache dữ liệu + chống đọc Firebase dư
//======================================================

import { readData } from "../../scripts/firebaseService.js";
import {showVideo,showMap,hideMedia} from "../components/floatingmedia.js";

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
            const data = await readData("admin/danhnhan");
            if(!data){
                LIST = [];
                CURRENT = null;
                DATA_LOADED_AT = Date.now();
                return LIST;
            }
            LIST = Object.entries(data).map(([id, item]) => ({id,...item}));
            sortData();
            CURRENT = LIST[0] || null;
            DATA_LOADED_AT = Date.now();
                        return LIST;
        }
        catch(err){
            console.error("❌ LOAD ẨM THỰC ERROR:",err);
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
    const menu = document.querySelector('.hl-menu[data-page="danhnhan"]');
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
        img.alt = CURRENT.title || CURRENT.name ||"Danh Nhân Hiền Lương";
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
    menu = document.querySelector('.mobile-menu-item[data-page="danhnhan"]');
}else{
    menu = document.querySelector('.hl-menu[data-page="danhnhan"]');
}
if(!menu){
    console.warn("⚠️ KHÔNG TÌM THẤY DANH NHÂN");
    return;
}
    if(!menu){
        return;
    }
    let list = menu.querySelector(".hl-danhnhan-menu");

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
    list.className = "hl-danhnhan-menu";
    LIST.forEach(
        item => {
            list.innerHTML += `
                <div
                    class="hl-danhnhan-row"
                    data-id="${item.id}"
                    title="${item.name || ""}"
                >
                    <div class="hl-danhnhan-row-icon">
                        👤
                    </div>
                    <div class="hl-danhnhan-row-title">
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

    //==================================================
    // ĐỔI BÀI → ĐÓNG MEDIA CŨ
    //==================================================

    hideMedia();
    if(!CURRENT){
        box.innerHTML = `<div class="hl-empty">Chưa có dữ liệu danh nhân.</div>`;
        return;
    }
    box.innerHTML = `
        <div class="hl-danhnhan">
            <h2 class="hl-danhnhan-title">
                ${CURRENT.name || ""}
            </h2>
            ${
                CURRENT.image
                ?
                `
                <div class="hl-danhnhan-image">
                    <img
                        src="${CURRENT.image}"
                        alt="${CURRENT.name || "Danh Nhân Hiền Lương"}"
                        decoding="async"
                    >
                </div>
                `
                :
                ""
            }

            ${
                CURRENT.address
                ?
                `
                <div class="hl-danhnhan-address">
                    <b>📍 Địa chỉ mộ:</b>
                    ${CURRENT.address}
                </div>
                `
                :
                ""
            }

            ${
                CURRENT.map
                ?
                `
                <div class="hl-danhnhan-map">

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

            ${
                CURRENT.video
                ?
                `
                <div class="hl-danhnhan-video">

                    <a
                        href="#"
                        class="btn-video"
                    >
                        🎬 Xem Video
                    </a>

                </div>
                `
                :
                ""
            }
		<div class="dn-row-tieusu">
                <strong>📚 Tiểu sử</strong>
            <div class="hl-danhnhan-content">
		 ${CURRENT.content || ""}
            </div>

        </div>

    `;

    //==================================================
    // BUTTON VIDEO
    //==================================================

    const btnVideo = box.querySelector(".btn-video");
    if(btnVideo){
        btnVideo.onclick = function(e){e.preventDefault();
        showVideo(CURRENT.video);
            };
    }

    //==================================================
    // BUTTON MAP
    //==================================================

    const btnMap = box.querySelector(".btn-map");
    if(btnMap){
        btnMap.onclick = function(e){e.preventDefault();
        showMap(CURRENT.map);
            };
    }
}

//======================================================
// BIND LIST EVENT
//======================================================

function bindListEvent(){

    document
        .querySelectorAll(
            ".hl-danhnhan-row"
        )
        .forEach(
            row => {
                row.onclick =
                    function(e){
                        e.stopPropagation();
                        const id = this.dataset.id;
                        CURRENT = LIST.find(item => item.id === id);
                        document.querySelectorAll(".hl-danhnhan-row").forEach(r =>r.classList.remove("active"));
                        this.classList.add("active");
                        renderMain();
                    };
            }
        );
}