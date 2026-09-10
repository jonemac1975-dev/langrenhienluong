//======================================================
// HIENLUONG WEBSITE
// File : customers.js
//======================================================

import {
readData
} from "../../scripts/firebaseService.js";

console.log("🔥 CUSTOMERS JS LOADED");

document.addEventListener(
"DOMContentLoaded",
init
);

//======================================================
// INIT
//======================================================

async function init(){


bindMenu();
bindHeader();

// Kiểm tra trạng thái thành viên
await checkMemberStatus();

// Mở hồ sơ mặc định
loadPage("hosoview");


}

//======================================================
// KIỂM TRA TRẠNG THÁI THÀNH VIÊN
//======================================================

async function checkMemberStatus(){


const uid =
    localStorage.getItem(
        "customer_uid"
    );

if(!uid){

    console.warn(
        "⚠️ Không tìm thấy customer_uid"
    );

    setMemberTabsDisabled(true);

    return;
}

try{

    const profile =
        await readData(
            `customers/${uid}/profile`
        );

    const status =
        profile?.status || "pending";

    console.log(
        "👤 MEMBER STATUS =",
        status
    );

    if(status === "approved"){

        setMemberTabsDisabled(false);

    }
    else{

        setMemberTabsDisabled(true);

    }

}
catch(err){

    console.error(
        "❌ CHECK MEMBER STATUS ERROR:",
        err
    );

    // Không đọc được trạng thái
    // → khóa để an toàn
    setMemberTabsDisabled(true);
}


}

//======================================================
// KHÓA / MỞ CÁC TAB THÀNH VIÊN
//======================================================

function setMemberTabsDisabled(disabled){

const pages = [
    "chuyenhangngay.html",
    "baiviet.html",
    "anhclip.html"
];

document
.querySelectorAll(".cus-menu")
.forEach(btn=>{

    const page =
        btn.dataset.page;

    if(pages.includes(page)){

        btn.disabled = disabled;

        btn.classList.toggle(
            "cus-menu-disabled",
            disabled
        );

        if(disabled){

            btn.title =
                "⏳ Tài khoản đang chờ Admin xét duyệt";

        }
        else{

            btn.title = "";

        }
    }

});


}

//======================================================
// HEADER
//======================================================

function bindHeader(){
document
.getElementById("btn-home")
?.addEventListener(
    "click",
    ()=>{
        localStorage.removeItem("customer_uid");
        localStorage.removeItem("customer_username");
        localStorage.removeItem("customer_avatar");

        location.href = "../../index.html";
    }
);

document
.getElementById("btn-account")
?.addEventListener(
    "click",
    ()=>{
        loadPage("userchange");
    }
);

document
.getElementById("btn-profile")
?.addEventListener(
    "click",
    ()=>{
        loadPage("hoso");
    }
);


}

//======================================================
// MENU
//======================================================

function bindMenu(){

document
.querySelectorAll(".cus-menu")
.forEach(btn=>{

    btn.onclick = ()=>{

        // Không cho mở tab bị khóa
        if(btn.disabled){

            alert(
                "⏳ Tài khoản của bạn đang chờ Admin xét duyệt."
            );

            return;
        }

        document
        .querySelectorAll(".cus-menu")
        .forEach(
            m =>
            m.classList.remove(
                "active"
            )
        );

        btn.classList.add(
            "active"
        );

        loadPage(
            btn.dataset.page
            .replace(".html","")
        );
    };

});


}

//======================================================
// LOAD PAGE
//======================================================

async function loadPage(page){


const container =
    document.getElementById(
        "customers-content"
    );

if(!container){
    return;
}

try{

    const html =
        await fetch(
            `${page}.html`
        );

    container.innerHTML =
        await html.text();

    const module =
        await import(
            `../js/${page}.js?t=${Date.now()}`
        );

    if(module.init){

        await module.init();

    }

}
catch(err){

    console.error(err);

    container.innerHTML =
        "<h3>Không tải được dữ liệu.</h3>";
}


}
