//======================================================
// HIENLUONG WEBSITE
// Module : CHUYỆN HÀNG NGÀY
// File   : /js/customers/chuyenhangngay.js
//======================================================

import {readData} from "../../scripts/firebaseService.js";
import {renderVideo} from "../../scripts/services/videoService.js";
import {getCustomers} from "../../scripts/customersCache.js";

//======================================================
// CONFIG
//======================================================

const CUSTOMERS_PATH = "customers";
const DATA_CACHE_TIME = 60000;
let DATA = [];
let CURRENT_ITEM = null;
let DATA_LOADED_AT = 0;
let DATA_LOADING = null;

//======================================================
// GET CONTENT BOX
//======================================================

function getContentBox(){
    return document.getElementById(
        "hl-content"
    );
}

//======================================================
// LOAD DATA
//======================================================

async function loadData(force = false){

    const now = Date.now();

    if(
        !force &&
        DATA_LOADED_AT &&
        DATA.length >= 0 &&
        (now - DATA_LOADED_AT) < DATA_CACHE_TIME
    ){
        return DATA;
    }

    if(DATA_LOADING){
        return DATA_LOADING;
    }

    DATA_LOADING = (async () => {

        try{
            const customers = await getCustomers();
            if(!customers){
                DATA = [];
                DATA_LOADED_AT = Date.now();
                return DATA;
            }
            const result = [];

            //================================================
            // DUYỆT TẤT CẢ USER
            //================================================

            Object.entries(customers)
                .forEach(
                    ([uid, customer]) => {
                        if(!customer){
                            return;
                        }

                        //====================================
                        // PROFILE
                        //====================================

                        const profile = customer.profile || {};
                        const fullname = profile.fullname || "Người dùng Hiền Lương";

                        //====================================
                        // CHUYỆN HÀNG NGÀY
                        //====================================

                        const stories = customer.chuyenhangngay;
                        if(!stories){
                            return;
                        }

                        Object.entries(stories)
                            .forEach(
                                ([id, item]) => {

                                    if(!item){
                                        return;
                                    }

                                    result.push({
                                        id,
                                        uid,
                                        fullname,
                                        title: item.title ||
                                            "Chuyện của tôi",
                                        content: item.content ||"",
                                        image: item.image ||"",
                                        clip: item.clip ||"",
                                        date: item.date ||"",
                                        created_at: Number(item.created_at) || 0,
                                        updated_at: Number(item.updated_at) || 0});
                                }
                            );
                    }
                );

            //================================================
            // SORT MỚI → CŨ
            //================================================

            result.sort(
                (a, b) => {
                    const timeA = getItemTime(a);
                    const timeB = getItemTime(b);
                    return timeB - timeA;
                }
            );
            DATA = result;
            DATA_LOADED_AT = Date.now();
            return DATA;
        }
        catch(err){
            console.error("❌ LOAD CHUYỆN HÀNG NGÀY ERROR:",err);
            DATA = [];
            DATA_LOADED_AT = 0;
            return DATA;
        }
        finally{
            DATA_LOADING = null;
        }
    })();
    return DATA_LOADING;
}

//======================================================
// GET ITEM TIME
//======================================================

function getItemTime(item){

    return (
        item.updated_at ||
        item.created_at ||
        getDateTime(item.date)
    );
}

//======================================================
// DATE → TIMESTAMP
//======================================================

function getDateTime(date){

    if(!date){
        return 0;
    }
    const time = new Date(date).getTime();
    return Number.isNaN(time)? 0: time;
}

//======================================================
// FORMAT DATE
//======================================================

function formatDate(item){

    if(item.date){

        //==============================================
        // Firebase đang lưu YYYY-MM-DD
        //==============================================

        const parts = String(item.date).split("-");
        if(parts.length === 3){
            return `
                ${parts[2]}/${parts[1]}/${parts[0]}
            `.trim();
        }
        return item.date;
    }

    const timestamp = item.updated_at || item.created_at;
    if(!timestamp){
        return "";
    }
    const date = new Date(timestamp);
    if(Number.isNaN(date.getTime())){
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

function escapeHTML(value){

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

//======================================================
// THUMBNAIL - Ô CHUYỆN HÀNG NGÀY
//======================================================

export async function initThumbnail(){

    const menu = document.querySelector('.hl-right .hl-menu[data-page="chuyenhangngay"]');
    if(!menu){
        console.warn("⚠️ KHÔNG TÌM THẤY MENU CHUYỆN HÀNG NGÀY"
        );
        return;
    }
    const thumb = menu.querySelector(".hl-thumb");
    if(!thumb){
        return;
    }

    //==================================================
    // Đọc dữ liệu
    //==================================================

    await loadData();

    //==================================================
    // Lấy bài mới nhất có ảnh
    //==================================================

    const latest = DATA.find(item => item.image);
    if(!latest){
        thumb.innerHTML = "";
        return;
    }

    //==================================================
    // Hiển thị ảnh
    //==================================================

    thumb.innerHTML = `
        <img
            src="${escapeHTML(latest.image)}"
            alt="Chuyện hàng ngày"
            loading="lazy"
            decoding="async">
    `;
}

//======================================================
// RENDER MAIN
//======================================================

export async function renderMain(){
    const box = getContentBox();
    if(!box){
        console.error("❌ KHÔNG TÌM THẤY #hl-content");
        return;
    }

    //==================================================
    // Loading
    //==================================================

    box.innerHTML = `
        <div class="hl-loading">
            Đang tải Chuyện hàng ngày...
        </div>
    `;

    //==================================================
    // Load
    //==================================================

    await loadData();

    //==================================================
    // Không có dữ liệu
    //==================================================

    if(!DATA.length){

        box.innerHTML = `
            <div class="chn-empty">
                <div class="chn-empty-icon">
                    📰
                </div>
                <div class="chn-empty-title">
                    Chưa có chuyện hàng ngày
                </div>

                <div class="chn-empty-text">
                    Hiện chưa có nội dung nào được chia sẻ.
               </div>
            </div>
        `;
        return;
    }

    CURRENT_ITEM = null;

    //==================================================
    // Hiển thị danh sách
    //==================================================

    renderList();
}

//======================================================
// RENDER LIST
//======================================================

function renderList(){

    const box = getContentBox();
    if(!box){
        return;
    }

    box.innerHTML = `
        <section class="chn-page">

            <div class="chn-header">
                <h2>
                    📰 Chuyện hàng ngày
                </h2>

                <div class="chn-count">
                    ${DATA.length} câu chuyện
                </div>

            </div>
            <div class="chn-list">
                ${
                    DATA
                        .map(
                            (item, index) =>
                                renderListItem(
                                    item,
                                    index
                                )
                        )
                        .join("")
                }

            </div>
        </section>
    `;

    //==================================================
    // CLICK TỪNG DÒNG
    //==================================================

    box
        .querySelectorAll(
            ".chn-item"
        )
        .forEach(
            item => {
                item.addEventListener(
                    "click",
                    () => {
                        const id = item.dataset.id;

                        const data = DATA.find(x =>x.id === id);
                        if(data){
                            CURRENT_ITEM =
                                data;
                            renderDetail(
                                data
                            );
                        }
                    }
                );
            }
        );
}

//======================================================
// RENDER LIST ITEM
//======================================================

function renderListItem(item,index){
    const image =
        item.image
            ? `
                <div class="chn-list-image">
                    <img
                        src="${escapeHTML(item.image)}"
                        alt="${escapeHTML(item.title)}"
                        loading="lazy"
                        decoding="async">
                </div>
            `
            : `
                <div class="chn-list-image chn-no-image">
                    📰
                </div>
            `;
    return `
        <article
            class="chn-item"
            data-id="${escapeHTML(item.id)}">
            ${image}

            <div class="chn-list-info">
                <h3 class="chn-title">
                    ${escapeHTML(item.title)}
                </h3>

                <div class="chn-author">
                    👤 ${escapeHTML(item.fullname)}
                </div>

                <div class="chn-date">
                    📅 ${escapeHTML(
                        formatDate(item)
                    )}
                </div>
            </div>
        </article>
    `;
}

//======================================================
// RENDER DETAIL
//======================================================

function renderDetail(item){

    const box = getContentBox();
    if(!box){
        return;
    }
    const image =
        item.image

            ? `
                <div class="chn-detail-image">
                    <img
                        src="${escapeHTML(item.image)}"
                        alt="${escapeHTML(item.title)}"
                        decoding="async">
                </div>
            `
            : "";

    const video = renderVideo(item.clip);
    box.innerHTML = `
        <article class="chn-detail">

            <button
                class="chn-back"
                type="button">
                ← Quay lại
            </button>
            <div class="chn-detail-header">

                <h2>
                    📰 ${escapeHTML(item.title)}
                </h2>

                <div class="chn-detail-author">

                    Người viết :
                    <strong>
                        ${escapeHTML(item.fullname)}
                    </strong>

                </div>

                <div class="chn-detail-date">

                    Ngày :
                    ${escapeHTML(
                        formatDate(item)
                    )}
                </div>
            </div>
            ${image}
            <div class="chn-detail-content">
                ${item.content || ""}
            </div>

            ${
                video
                    ? `
                        <div class="chn-detail-video">
                            ${video}
                        </div>
                    `
                    : ""
            }

        </article>
    `;

    //==================================================
    // BACK
    //==================================================

    const back = box.querySelector(".chn-back");
    if(back){
        back.addEventListener(
            "click",
            () => {
                CURRENT_ITEM = null;
                renderList();
            }
        );
    }
}

//======================================================
// GET DATA
//======================================================

export function getData(){
    return DATA;
}