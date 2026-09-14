//======================================================
// HIENLUONG WEBSITE
// File : /js/admin/tulieu.js
// Tối ưu: cache dữ liệu + chống đọc Firebase dư
//======================================================

import {readData} from "../../scripts/firebaseService.js";
import {showVideo,hideMedia} from "../components/floatingmedia.js";

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
            const data = await readData("admin/tulieu");
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
            console.error("❌ LOAD TƯ LIỆU ERROR:",err);
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
    const menu = document.querySelector('.hl-menu[data-page="tulieu"]');
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
        img.alt = CURRENT.title ||"Tư liệu Hiền Lương";
        img.loading ="lazy";
        img.decoding ="async";
        img.style.display ="block";
        img.style.width ="100%";
        img.style.height ="auto";
        img.style.maxWidth ="100%";
        img.style.objectFit ="contain";
        img.style.objectPosition ="center";
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
    menu = document.querySelector('.mobile-menu-item[data-page="tulieu"]');
}else{
    menu = document.querySelector('.hl-menu[data-page="tulieu"]');
}
if(!menu){
    console.warn("⚠️ KHÔNG TÌM THẤY MENU TƯ LIỆU");
    return;
}
    if(!menu){
        return;
    }
    let list = menu.querySelector(".hl-tulieu-menu");

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
    list.className ="hl-tulieu-menu";
    LIST.forEach(
        item => {
            list.innerHTML += `
                <div
                    class="hl-tulieu-row"
                    data-id="${item.id}"
                    title="${item.title || ""}"
                >
                    <div class="hl-tulieu-row-icon">
                        📚
                    </div>

                    <div class="hl-tulieu-row-title">
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
        bg.style.display = "none";
    }
    hideMedia();
    if(!CURRENT){
        box.innerHTML = `
            <div class="hl-empty">
                Chưa có dữ liệu tư liệu.
            </div>
        `;
        return;
    }
    box.innerHTML = `
        <div class="hl-tulieu">
            <h2 class="hl-tulieu-title">
                ${CURRENT.title || ""}
            </h2>
            ${
                CURRENT.type
                ?
                `
                <div class="hl-tulieu-type">
                    <b>📚 Loại tư liệu:</b>
                    ${CURRENT.type}
                </div>
                `
                :
                ""
            }
            ${
                CURRENT.image
                ?
                `
                <div class="hl-tulieu-image">
                    <img
                        src="${CURRENT.image}"
                        alt="${CURRENT.title || "Tư liệu Hiền Lương"}"
                        decoding="async"
                    >
                </div>
                `
                :
                ""
            }
            ${
                CURRENT.source
                ?
                `
                <div class="hl-tulieu-source">
                    <b>📖 Nguồn:</b>
                    ${CURRENT.source}
                </div>
                `
                :
                ""
            }
            ${
                CURRENT.author
                ?
                `
                <div class="hl-tulieu-author">
                    <b>✍ Tác giả:</b>
                    ${CURRENT.author}
                </div>
                `
                :
                ""
            }
            ${
                CURRENT.link
                ?
                `
                <div class="hl-tulieu-link">
                    <a
                        href="#"
                        class="btn-link"
                    >
                        🔗 Xem tư liệu
                    </a>

                </div>
                `
                :
                ""
            }

            <div class="hl-tulieu-content">
                ${CURRENT.content || ""}
            </div>

        </div>

    `;

    //==================================================
    // LINK
    //==================================================

    const btn = box.querySelector(".btn-link");
    if(btn){
        btn.onclick = function(e){e.preventDefault();
        const url = CURRENT.link || "";
                if(
                    url.includes(
                        "youtube.com"
                    ) ||
                    url.includes(
                        "youtu.be"
                    ) ||
                    url.includes(
                        "drive.google.com"
                    )
                ){
                    showVideo(
                        url
                    );
                }
                else{
                    window.open(
                        url,
                        "_blank",
                        "noopener,noreferrer"
                    );
                }
            };
    }
}

//======================================================
// BIND LIST EVENT
//======================================================

function bindListEvent(){

    document
        .querySelectorAll(
            ".hl-tulieu-row"
        )
        .forEach(
            row => {
                row.onclick =
                    function(e){
                        e.stopPropagation();
                        const id = this.dataset.id;
                        CURRENT = LIST.find(item => item.id === id);
                        document
                            .querySelectorAll(
                                ".hl-tulieu-row"
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