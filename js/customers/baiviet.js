//======================================================
// HIENLUONG WEBSITE
// File : /js/customers/baiviet.js
// Module : Bài viết cá nhân - INDEX
//======================================================

import { readData } from "../../scripts/firebaseService.js";
import { renderVideo } from "../../scripts/services/videoService.js";

//======================================================
// BIẾN
//======================================================

let LIST = [];
let LOADED = false;


//======================================================
// INIT THUMBNAIL
//======================================================

export async function initThumbnail(){

    console.log("🖼️ BÀI VIẾT - LOAD THUMBNAIL");

    const thumb =
        document.querySelector(
            '.hl-right .hl-menu[data-page="baiviet"] .hl-thumb'
        );

    if(!thumb){
        console.warn("⚠️ Không tìm thấy thumbnail Bài viết");
        return;
    }

    try{

        await loadData();

        if(!LIST.length){

            thumb.innerHTML = "";

            return;
        }

        const latest = LIST[0];

        if(latest.image){

            thumb.innerHTML = `
                <img
                    src="${latest.image}"
                    alt="Bài viết mới nhất">
            `;

        }
        else{

            thumb.innerHTML = `
                <div class="bv-index-no-image">
                    ✍️
                </div>
            `;

        }

        LOADED = true;

        console.log(
            "✅ BÀI VIẾT THUMBNAIL:",
            latest
        );

    }
    catch(err){

        console.error(
            "❌ Không load thumbnail bài viết:",
            err
        );

    }

}


//======================================================
// LOAD DATA
//======================================================

async function loadData(){

    LIST = [];

    try{

        const customers =
            await readData("customers");

        if(!customers){

            return;
        }


        //================================================
        // DUYỆT TẤT CẢ CUSTOMER
        //================================================

        for(
            const [uid, customer]
            of Object.entries(customers)
        ){

            if(!customer){

                continue;
            }


            //================================================
            // PROFILE
            //================================================

            const fullname =
                customer.profile?.fullname ||
                "Thành viên";


            //================================================
            // BÀI VIẾT
            //================================================

            const posts =
                customer.baiviet;

            if(!posts){

                continue;
            }


            for(
                const [id, item]
                of Object.entries(posts)
            ){

                if(!item){

                    continue;
                }

                LIST.push({

                    id,

                    uid,

                    fullname,

                    caption:
                        item.caption || "",

                    content:
                        item.content || "",

                    image:
                        item.image || "",

                    clip:
                        item.clip || "",

                    created_at:
                        Number(
                            item.created_at || 0
                        ),

                    updated_at:
                        Number(
                            item.updated_at ||
                            item.created_at ||
                            0
                        )

                });

            }

        }


        sortData();

        console.log(
            "📚 INDEX BÀI VIẾT:",
            LIST
        );

    }
    catch(err){

        console.error(
            "❌ LOAD BÀI VIẾT ERROR:",
            err
        );

    }

}


//======================================================
// SORT
//======================================================

function sortData(){

    LIST.sort(
        (a,b) =>
            b.updated_at -
            a.updated_at
    );

}


//======================================================
// RENDER MAIN
//======================================================

//======================================================
// RENDER MAIN
//======================================================

export async function renderMain(){

    const box =
        document.getElementById("hl-content");

    if(!box){
        return;
    }

    //==================================================
    // LOAD DỮ LIỆU MỚI NHẤT
    //==================================================

    box.innerHTML = `
        <div class="hl-loading">
            Đang tải Bài viết cá nhân...
        </div>
    `;

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

    const box =
        document.getElementById(
            "bv-index-list"
        );

    if(!box){

        return;
    }


    if(!LIST.length){

        box.innerHTML = `
            <div class="bv-index-empty">
                Chưa có bài viết.
            </div>
        `;

        return;
    }


    box.innerHTML =
        LIST
        .map(item => {

            const date =
                formatDate(
                    item.created_at
                );


            return `

                <article
                    class="bv-index-item"
                    data-id="${item.id}">

                    <div
                        class="bv-index-avatar">

                        ${
                            item.image
                            ?
                            `
                            <img
                                src="${item.image}"
                                alt="Ảnh bài viết">
                            `
                            :
                            `
                            <div class="bv-index-no-image">
                                ✍️
                            </div>
                            `
                        }

                    </div>


                    <div
                        class="bv-index-info">

                        <div
                            class="bv-index-caption">

                            ${
                                escapeHtml(
                                    item.caption ||
                                    "Bài viết cá nhân"
                                )
                            }

                        </div>


                        <div
                            class="bv-index-author">

                            👤
                            ${escapeHtml(
                                item.fullname
                            )}

                        </div>


                        <div
                            class="bv-index-date">

                            📅 ${date}

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
    .forEach(item => {

        item.onclick = () => {

            const id =
                item.dataset.id;

            renderDetail(id);

        };

    });

}


//======================================================
// RENDER DETAIL
//======================================================

function renderDetail(id){

    const item =
        LIST.find(
            x => x.id === id
        );

    if(!item){
        return;
    }


    const list =
        document.getElementById(
            "bv-index-list"
        );

    const detail =
        document.getElementById(
            "bv-index-detail"
        );

    if(!detail){
        return;
    }


    //==================================================
    // ẨN DANH SÁCH
    //==================================================

    if(list){

        list.style.display = "none";

    }


    //==================================================
    // HIỆN CHI TIẾT
    //==================================================

    detail.style.display = "block";


    detail.innerHTML = `

        <button
            type="button"
            class="bv-index-back"
            id="bv-index-back">

            ← Quay lại danh sách bài viết

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
                        src="${item.image}"
                        alt="Ảnh bài viết">

                </div>
                `
                :
                ""
            }


            ${
    item.clip
    ?
    `
    <div class="bv-index-post-clip">

        ${renderVideo(item.clip)}

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
 
    document.getElementById("bv-index-back")?.addEventListener("click",showList);
    detail.scrollIntoView({behavior: "smooth",block: "start"});
}

function showList(){
    const list = document.getElementById("bv-index-list");
    const detail = document.getElementById("bv-index-detail");


    //==================================================
    // HIỆN LẠI DANH SÁCH
    //==================================================
    if(list){list.style.display = "";
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



//======================================================
// FORMAT DATE
//======================================================

function formatDate(timestamp){

    if(!timestamp){

        return "";
    }

    const date =
        new Date(
            Number(timestamp)
        );

    if(
        Number.isNaN(
            date.getTime()
        )
    ){

        return "";
    }

    return date.toLocaleDateString(
        "vi-VN",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}


//======================================================
// ESCAPE HTML
//======================================================

function escapeHtml(value){

    return String(value || "")

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