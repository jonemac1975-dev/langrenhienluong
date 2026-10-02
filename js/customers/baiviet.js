//======================================================
// HIENLUONG WEBSITE
// File : /js/customers/baiviet.js
// Module : Bài viết cá nhân - INDEX
//======================================================

import {readData} from "../../scripts/firebaseService.js";
import {renderVideo} from "../../scripts/services/videoService.js";
import {getCustomers} from "../../scripts/customersCache.js";
//======================================================
// BIẾN
//======================================================

let LIST = [];
const DATA_CACHE_TIME = 60000;
let DATA_LOADED_AT = 0;
let DATA_LOADING = null;


//======================================================
// INIT THUMBNAIL
//======================================================

export async function initThumbnail(){

    const thumb = document.querySelector('.hl-right .hl-menu[data-page="baiviet"] .hl-thumb');
    if(!thumb){
        console.warn("⚠️ Không tìm thấy thumbnail Bài viết");
        return;
    }

    try{

        //================================================
        // LOAD DATA
        //================================================

        await loadData();

        //================================================
        // KHÔNG CÓ BÀI VIẾT
        //================================================

        if(!LIST.length){
            thumb.innerHTML = "";
            return;
        }

        //================================================
        // BÀI MỚI NHẤT
        //================================================

        const latest = LIST[0];

        //================================================
        // HIỂN THỊ THUMBNAIL
        //================================================

        if(latest.image){
            thumb.innerHTML = `
                <img
                    src="${escapeHtml(latest.image)}"
                    alt="Bài viết mới nhất"
                    loading="lazy"
                    decoding="async">
            `;
        }
        else{
            thumb.innerHTML = `
                <div class="bv-index-no-image">
                    ✍️
                </div>
           `;
        }
    }
    catch(err){
        console.error("❌ Không load thumbnail bài viết:",err);
    }
}

//======================================================
// LOAD DATA
//======================================================

async function loadData(force = false){

    const now = Date.now();

    //==================================================
    // DÙNG CACHE TRONG 60 GIÂY
    //==================================================

    if(
        !force &&
        DATA_LOADED_AT &&
        (now - DATA_LOADED_AT) <
        DATA_CACHE_TIME
    ){
        return LIST;
    }

    //==================================================
    // NẾU ĐANG CÓ REQUEST → DÙNG CHUNG
    //==================================================

    if(DATA_LOADING){
        return DATA_LOADING;
    }

    DATA_LOADING =
        (async () => {
            try{
                const customers = await getCustomers();
                if(!customers){
                    LIST = [];
                    DATA_LOADED_AT = Date.now();
                    return LIST;
                }
                const result = [];

                //================================================
                // DUYỆT TẤT CẢ CUSTOMER
                //================================================

                for(
                    const [
                        uid,
                        customer
                    ]
                    of Object.entries(
                        customers
                    )
                ){

                    if(!customer){

                        continue;
                    }

                    //============================================
                    // PROFILE
                    //============================================

                    const fullname = customer.profile ?.fullname ||"Thành viên";

                    //============================================
                    // BÀI VIẾT
                    //============================================

                    const posts = customer.baiviet;
                    if(!posts){
                        continue;
                    }
                    for(
                        const [
                            id,
                            item
                        ]
                        of Object.entries(
                            posts
                        )
                    ){
                        if(!item){
                            continue;
                        }
                        result.push({
                            id,
                            uid,
                            fullname,
                            caption:item.caption ||"",
                            content:item.content ||"",
                            image:item.image || "",
                            clip:item.clip ||"",
                            created_at:Number(item.created_at || 0),
                            updated_at:Number(item.updated_at ||item.created_at ||0)});
                    }
                }

                //================================================
                // SORT MỚI → CŨ
                //================================================

                result.sort((a, b) =>b.updated_at - a.updated_at);
                LIST = result;
                DATA_LOADED_AT = Date.now();
                return LIST;
            }
            catch(err){
                console.error("❌ LOAD BÀI VIẾT ERROR:",err);
                LIST = [];
                DATA_LOADED_AT = 0;
                return LIST;
            }
            finally{
                DATA_LOADING = null;
            }
        })();
    return DATA_LOADING;
}

export async function renderItemInline(id,box){
    await loadData();
    const item=LIST.find(x=>x.id===id);
    if(!item){
        console.warn("⚠️ KHÔNG TÌM THẤY BÀI VIẾT:",id);
        return;
    }

    const image=item.image?`
        <div class="bv-index-post-image">
            <img src="${escapeHtml(item.image)}" alt="Ảnh bài viết" decoding="async">
        </div>
    `:"";

    const video=item.clip?`
        <div class="bv-index-post-clip">
            ${renderVideo(item.clip)}
        </div>
    `:"";

    box.innerHTML=`
        <div class="bv-index-post">
            <button type="button" class="bv-index-back">← Quay lại danh sách</button>
            <div class="bv-index-post-title">${escapeHtml(item.caption||"Bài viết cá nhân")}</div>
            <div class="bv-index-post-meta">
                👤 Người viết : <strong>${escapeHtml(item.fullname)}</strong>
                <br>
                📅 Ngày : ${formatDate(item.created_at)}
            </div>
            ${item.content?`<div class="bv-index-post-content">${item.content}</div>`:""}
            ${image}
            ${video}
        </div>
    `;

    const back=box.querySelector(".bv-index-back");
    if(back){
        back.addEventListener("click",async function(event){
            event.stopPropagation();
            if(typeof window.loadBaiVietInlineList==="function"){
                await window.loadBaiVietInlineList();
            }
        });
    }
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
    // LOADING
    //==================================================

    box.innerHTML = `<div class="hl-loading"> Đang tải Bài viết cá nhân... </div>`;

    //==================================================
    // LOAD DATA
    //==================================================

    await loadData();

    //==================================================
    // GIAO DIỆN
    //==================================================

    box.innerHTML = `
        <div class="bv-index-page">

            <div class="bv-index-header">

                <h2>
                    ✍ Bài viết cá nhân
                </h2>

                <div class="bv-index-count">
                    ${LIST.length} bài viết
                </div>

            </div>

            <div
                id="bv-index-list"
                class="bv-index-list">
            </div>

            <div
                id="bv-index-detail"
                class="bv-index-detail">
            </div>

        </div>
    `;
    renderList();
}


//======================================================
// RENDER LIST
//======================================================

function renderList(){

    const box = document.getElementById("bv-index-list");
    if(!box){
        return;
    }

    if(!LIST.length){
        box.innerHTML = `<div class="bv-index-empty"> Chưa có bài viết.</div>`;
        return;
    }
    box.innerHTML =
    LIST
        .map(item => {
            const date = formatDate(item.created_at);
            const image = item.image
                ? `
                    <div class="bv-index-avatar">
                        <img
                            src="${escapeHtml(item.image)}"
                            alt="Ảnh bài viết"
                            loading="lazy"
                            decoding="async">
                    </div>
                `
                : `
                    <div class="bv-index-avatar bv-index-no-image">
                        ✍️
                    </div>
                `;

            return `
                <article
                    class="bv-index-item"
                    data-id="${escapeHtml(item.id)}">

                    <div class="bv-index-info">

                        <div class="bv-index-caption">
                            ${escapeHtml(
                                item.caption ||
                                "Bài viết cá nhân"
                            )}
                        </div>

                        <div class="bv-index-meta">

                            ${image}

                            <div class="bv-index-meta-text">

                                <div class="bv-index-author">
                                    👤 ${escapeHtml(
                                        item.fullname
                                    )}
                                </div>

                                <div class="bv-index-date">
                                    📅 ${date}
                                </div>

                            </div>

                        </div>

                    </div>

                </article>
            `;
        })
        .join("");

bindListEvents();

}

//======================================================
// BIND LIST
//======================================================

function bindListEvents(){

    document
        .querySelectorAll(
            ".bv-index-item"
        )
        .forEach(
            item => {
                item.onclick = () => {
                    const id = item.dataset.id;
                    renderDetail(
                        id
                    );
                };
            }
        );
}


//======================================================
// RENDER DETAIL
//======================================================

function renderDetail(id){

    const item = LIST.find(x =>x.id === id);
    if(!item){
        return;
    }
    const list = document.getElementById("bv-index-list");
    const detail = document.getElementById("bv-index-detail");
    if(!detail){
        return;
    }

    //==================================================
    // ẨN DANH SÁCH
    //==================================================

    if(list){
        list.style.display ="none";
    }

    //==================================================
    // HIỆN CHI TIẾT
    //==================================================

    detail.style.display ="block";
    detail.innerHTML = `
        <button
            type="button"
            class="bv-index-back"
            id="bv-index-back">
            ← Quay lại
        </button>

        <article
            class="bv-index-post">

            <div
                class="bv-index-post-title">

                ${
                    escapeHtml(
                        item.caption ||
                        "Bài viết cá nhân"
                    )
                }

            </div>

            <div
                class="bv-index-post-meta">

                👤 Người viết :
                <strong>
                    ${escapeHtml(
                        item.fullname
                    )}
                </strong>

                <br>

                📅 Ngày :
                ${formatDate(
                    item.created_at
                )}

            </div>

            ${
                item.content
                    ?
                    `
                    <div
                        class="bv-index-post-content">

                        ${item.content}

                    </div>
                    `
                    :
                    ""
            }

            ${
                item.image
                    ?
                    `
                    <div
                        class="bv-index-post-image">

                        <img
                            src="${escapeHtml(item.image)}"
                            alt="Ảnh bài viết"
                            decoding="async">

                    </div>
                    `
                    :
                    ""
            }

            ${
                item.clip
                    ?
                    `
                    <div
                        class="bv-index-post-clip">

                        ${renderVideo(
                            item.clip
                        )}

                    </div>
                    `
                    :
                    ""
            }

        </article>

    `;

    //==================================================
    // BACK
    //==================================================

    document
        .getElementById(
            "bv-index-back"
        )
        ?.addEventListener(
            "click",
            showList
        );

    detail.scrollIntoView(
        {
            behavior: "smooth",
            block: "start"
        }
    );

}


//======================================================
// SHOW LIST
//======================================================

function showList(){

    const list = document.getElementById("bv-index-list");
    const detail = document.getElementById("bv-index-detail");

    //==================================================
    // HIỆN LẠI DANH SÁCH
    //==================================================

    if(list){
        list.style.display = "";
    }

    //==================================================
    // ẨN CHI TIẾT
    //==================================================

    if(detail){
        detail.innerHTML = "";
        detail.style.display = "none";
    }

    //==================================================
    // CUỘN VỀ ĐẦU DANH SÁCH
    //==================================================

    list?.scrollIntoView({behavior: "smooth",block: "start"});
}

function formatDate(timestamp){
if(!timestamp)return "";
const date=new Date(Number(timestamp));
if(Number.isNaN(date.getTime()))return "";
return date.toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"});
}


export async function getList(){
await loadData();
return LIST;
}

export async function renderItem(id){
await loadData();
const item=LIST.find(x=>x.id===id);
if(!item){
console.warn("⚠️ KHÔNG TÌM THẤY BÀI VIẾT:",id);
return;
}
const box=document.getElementById("hl-content");
if(!box)return;
const bg=document.getElementById("bg-main");
if(bg)bg.style.display="none";
box.innerHTML=`         <div class="bv-index-post">             <button type="button" class="bv-index-back" id="bv-index-back">← Quay lại</button>             <div class="bv-index-post-title">${escapeHtml(item.caption||"Bài viết cá nhân")}</div>             <div class="bv-index-post-meta">
                👤 Người viết :                 <strong>${escapeHtml(item.fullname)}</strong>                 <br>
                📅 Ngày : ${formatDate(item.created_at)}             </div>
            ${item.content?`<div class="bv-index-post-content">${item.content}</div>`:""}
            ${item.image?`<div class="bv-index-post-image"><img src="${escapeHtml(item.image)}" alt="Ảnh bài viết" decoding="async"></div>`:""}
            ${item.clip?`<div class="bv-index-post-clip">${renderVideo(item.clip)}</div>`:""}         </div>`;
const back=document.getElementById("bv-index-back");
if(back){
back.addEventListener("click",()=>{
box.innerHTML="";
const bg=document.getElementById("bg-main");
if(bg)bg.style.display="";
const card=document.getElementById("hl-card-baiviet");
if(card)card.scrollIntoView({behavior:"smooth",block:"center"});
});
}
requestAnimationFrame(()=>{
box.scrollIntoView({behavior:"smooth",block:"start"});
});
}



//======================================================
// ESCAPE HTML
//======================================================

function escapeHtml(value){

    return String(
        value || ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}