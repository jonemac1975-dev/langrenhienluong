//======================================================
// HIENLUONG WEBSITE
// File : /js/customers/thanhvien.js
// MODULE : DANH SÁCH THÀNH VIÊN
//======================================================

import {readData} from "../../scripts/firebaseService.js";

//======================================================
// THUMBNAIL
//======================================================

export async function initThumbnail(){
    const menus = document.querySelectorAll('.hl-menu[data-page="thanhvien"]');
    if(!menus.length){
        return;
    }

    menus.forEach(menu => {
        const thumb = menu.querySelector(".hl-thumb");
        if(!thumb){
            return;
        }

        thumb.innerHTML = `<div class="tv-thumb-text">👥 DS thành viên </div>`;
    });
}


//======================================================
// MAIN
//======================================================

export async function renderMain(){
    const box = document.getElementById("hl-content");
    if(!box){
        console.warn("⚠️ Không tìm thấy #hl-content");
        return;
    }
    box.innerHTML = `<div class="thanhvien-loading">Đang tải danh sách thành viên...</div>`;
    try{
        const customers = await readData("customers");
        renderList(box,customers || {});
    }
    catch(err){console.error("❌ LOAD THÀNH VIÊN ERROR:",err);

        box.innerHTML = `
            <div class="thanhvien-error">
                Không thể tải danh sách thành viên.
            </div>
        `;
    }
}


//======================================================
// RENDER LIST
//======================================================

function renderList(box, customers){

    const members =
        Object.entries(customers)
        .map(([uid, customer]) => {

            const profile =
                customer?.profile || {};

            return {
    uid,
    fullname:
        profile.fullname || "",
    nationality:
        profile.nationality || "",
    avatar:
        profile.avatar || "",
    status:
        profile.status || "pending"
};
        })
        .filter(member =>
            member.status === "approved"
            &&
            member.fullname
        );


    //==================================================
    // KHÔNG CÓ THÀNH VIÊN
    //==================================================

    if(!members.length){
        box.innerHTML = `
            <div class="thanhvien-page">
                <div class="thanhvien-box">
                    <h2>
                        👥 DANH SÁCH THÀNH VIÊN
                    </h2>
                    <div class="thanhvien-empty">
                        Chưa có thành viên chính thức.
                    </div>
                </div>
            </div>
        `;
        return;
    }


    //==================================================
    // DANH SÁCH
    //==================================================

    box.innerHTML = `
        <div class="thanhvien-page">
            <div class="thanhvien-box">
                <h2>
                    👥 DANH SÁCH THÀNH VIÊN
                </h2>
                <div class="thanhvien-list">
                    ${members.map(member => {
                        const avatar = member.avatar || "../../images/avatar-default.png";
                        return `
                            <div class="thanhvien-item">
                                <div class="thanhvien-avatar">
                                    <img
                                        src="${avatar}"
                                        alt="Ảnh thành viên">
                                </div>

                                <div class="thanhvien-info">
    <div class="thanhvien-name">
        ${escapeHtml(member.fullname)}
    </div>

    <div class="thanhvien-nationality">
        🌐 ${escapeHtml(member.nationality || "Chưa cập nhật")}
    </div>

</div>
                           </div>
                        `;
                    }).join("")}
                </div>
            </div>
        </div>
    `;
}


//======================================================
// ESCAPE HTML
//======================================================

function escapeHtml(value){
    return String(value || "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}