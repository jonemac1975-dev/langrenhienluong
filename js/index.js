//======================================================
// HIENLUONG WEBSITE
// File : /js/index.js
//======================================================

import "./bgmain.js";
import { readData } from "../scripts/firebaseService.js";

import * as gioithieu from "./admin/gioithieu.js";
import * as lichsu from "./admin/lichsu.js";
import * as danhthang from "./admin/danhthang.js";
import * as amthuc from "./admin/amthuc.js";
import * as diadanh from "./admin/diadanh.js";
import * as hotoc from "./admin/hotoc.js";
import * as tulieu from "./admin/tulieu.js";
 
//======================================================
// CUSTOMER MODULE
//======================================================

import * as chuyenhangngay from "./customers/chuyenhangngay.js";
import * as baiviet from "./customers/baiviet.js";
import * as thanhvien from "./customers/thanhvien.js";
console.log("🚀 INDEX LOADED");

//======================================================
// MODULE PATH
//======================================================

const MODULE_PATH = {

    // LEFT
    gioithieu: "./admin/gioithieu.js",
    lichsu: "./admin/lichsu.js",
    danhthang: "./admin/danhthang.js",
    amthuc: "./admin/amthuc.js",
    diadanh: "./admin/diadanh.js",
    hotoc: "./admin/hotoc.js",
    tulieu: "./admin/tulieu.js",

    // RIGHT
    chuyenhangngay:"./customers/chuyenhangngay.js",
    baiviet:"./customers/baiviet.js",
    thanhvien:"./customers/thanhvien.js"};
     
let CURRENT_PAGE = "";

//======================================================
// DOM READY
//======================================================

document.addEventListener("DOMContentLoaded",init);

//======================================================
// INIT
//======================================================

async function init(){

    console.log("🔥 WEBSITE START");

    bindMenu();

    //==================================================
    // LEFT THUMBNAIL
    //==================================================

    if(gioithieu.initThumbnail)
        await gioithieu.initThumbnail();

    if(lichsu.initThumbnail)
        await lichsu.initThumbnail();

    if(danhthang.initThumbnail)
        await danhthang.initThumbnail();

    if(amthuc.initThumbnail)
        await amthuc.initThumbnail();

    if(diadanh.initThumbnail)
        await diadanh.initThumbnail();

    if(hotoc.initThumbnail)
        await hotoc.initThumbnail();

    if(tulieu.initThumbnail)
        await tulieu.initThumbnail();

    //==================================================
    // RIGHT - CHUYỆN HÀNG NGÀY
    //==================================================

    if(chuyenhangngay.initThumbnail)
        await chuyenhangngay.initThumbnail();

    if(baiviet.initThumbnail)
        await baiviet.initThumbnail();

    if(thanhvien.initThumbnail)
        await thanhvien.initThumbnail();

    console.log("✅ WEBSITE READY");

}

//======================================================
// MENU
//======================================================

function bindMenu(){

    document
        .querySelectorAll(
            ".hl-left .hl-menu, .hl-right .hl-menu"
        )
        .forEach(menu => {

            menu.onclick = function(){

                //======================================
                // Xóa active
                //======================================

                document
                    .querySelectorAll(
                        ".hl-left .hl-menu, .hl-right .hl-menu"
                    )
                    .forEach(m => {

                        m.classList.remove("active");

                    });

                //======================================
                // Active menu
                //======================================

                this.classList.add("active");

                //======================================
                // Page
                //======================================

                const page =
                    this.dataset.page;

                if(!page){

                    console.warn(
                        "⚠️ MENU KHÔNG CÓ data-page:",
                        this
                    );

                    return;

                }

                loadPage(page);

            };

        });

}

//======================================================
// LOAD PAGE
//======================================================

async function loadPage(page){

    console.log("🔄 LOAD PAGE:", page);

    CURRENT_PAGE = page;
    const file =
        MODULE_PATH[page];

    if(!file){

        console.warn(
            "⚠️ KHÔNG TÌM THẤY MODULE:",
            page
        );

        return;

    }

    const box =
        document.getElementById(
            "hl-content"
        );

    if(box){

        box.innerHTML = `
            <div class="hl-loading">
                Đang tải dữ liệu...
            </div>
        `;

    }

    try{

        const module =
    await import(file);
        if(module.renderMain){
            await module.renderMain();
            hideBackground();
        }
        console.log("✅ LOAD:",page );

    }
    catch(err){
        console.error("❌ LOAD ERROR:",page, err);
        if(box){

            box.innerHTML = `
                <div class="hl-error">
                    Không thể tải dữ liệu.
                </div>
            `;

        }

    }

}

//======================================================
// HIDE BACKGROUND
//======================================================

function hideBackground(){

    const bg =
        document.getElementById(
            "bg-main"
        );

    if(bg){

        bg.style.display = "none";

    }

}