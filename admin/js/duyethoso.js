/*======================================================
HIỀN LƯƠNG
FILE : /admin/js/duyethoso.js
MODULE : DUYỆT HỒ SƠ THÀNH VIÊN
======================================================*/

import {readData,writeData} from "../../scripts/firebaseService.js";
console.log("🔥 duyethoso.js loaded");

//======================================================
// BIẾN
//======================================================

let CUSTOMERS = {};
let CURRENT_UID = null;

//======================================================
// INIT
//======================================================

export async function init(){
console.log("🚀 DUYỆT HỒ SƠ INIT");
await loadCustomers();
renderList();
bindEvents();
}

//======================================================
// LOAD CUSTOMERS
//======================================================

async function loadCustomers(){
try{
    const data = await readData("customers");
    CUSTOMERS = data || {};
    console.log("📥 CUSTOMERS =",CUSTOMERS);
}
catch(err){
    console.error("❌ LOAD CUSTOMERS ERROR:",err);
    CUSTOMERS = {};
}
}

//======================================================
// RENDER LIST
//======================================================

function renderList(){
const body = document.getElementById("duyet-hoso-body");
if(!body){
    return;
}
const entries = Object.entries(CUSTOMERS);
if(!entries.length){
    body.innerHTML = `
        <tr>
            <td colspan="9">
                Chưa có thành viên.
            </td>
        </tr>
    `;
    return;
}
body.innerHTML = entries.map(([uid, customer], index)=>{ const profile = customer?.profile || {};
            const status = profile.status ||"pending";
            return `
            <tr>
                <td>
                    ${index + 1}
                </td>
                <td>
                    ${escapeHtml(uid)}
                </td>
                <td>
                    ${escapeHtml(
                        profile.username || ""
                    )}
                </td>
                <td>
                    ${escapeHtml(
                        profile.fullname || ""
                    )}
                </td>
                <td>
                    ${escapeHtml(
                        profile.address || ""
                    )}
                </td>
                <td>
                    ${escapeHtml(
                        profile.phone || ""
                    )}
                </td>
                <td>
                    <span
                        class="
                        duyet-status
                        duyet-status-${status}
                        ">
                        ${getStatusText(status)}
                    </span>
                </td>
                <td>
                    <button
                        type="button"
                        class="duyet-view"
                        data-id="${uid}">
                        👁 Xem hồ sơ
                    </button>
                </td>
                <td>
    <input
        type="checkbox"
        class="duyet-check"
        data-id="${uid}"
        ${status === "approved" ? "checked" : ""}
    >
</td>

            </tr>

            `;

        }
    ).join("");

bindListEvents();
}

//======================================================
// STATUS TEXT
//======================================================

function getStatusText(status){
if(status === "approved"){
    return "✅ Thành viên chính thức";
}
if(status === "rejected"){
    return "❌ Không được duyệt";
}

return "⏳ Chờ Admin duyệt";
}

//======================================================
// BIND LIST EVENTS
//======================================================

function bindListEvents(){
document
.querySelectorAll(".duyet-view")
.forEach(button=>{
    button.onclick = ()=>{
        const uid =
            button.dataset.id;
        showProfile(uid);
    };
});

document
.querySelectorAll(".duyet-check")
.forEach(check=>{

    check.onchange = ()=>{

        const uid = check.dataset.id;

        if(check.checked){

            approveCustomer(uid);

        }else{

            unapproveCustomer(uid);

        }

    };

});
}

//======================================================
// SHOW PROFILE
//======================================================

function showProfile(uid){
const customer =
    CUSTOMERS[uid];
if(!customer){
    return;
}

const profile = customer.profile || {};
CURRENT_UID = uid;
const detail = document.getElementById("duyet-hoso-detail");
if(!detail){
    return;
}

setValue("dh-id",uid);
setValue("dh-username",profile.username);
setValue("dh-fullname",profile.fullname);
setValue("dh-gender",profile.gender);
setValue("dh-address",profile.address);
setValue("dh-nationality",profile.nationality);
setValue("dh-phone",profile.phone);
setValue("dh-gmail",profile.gmail);
setValue("dh-zalo",profile.zalo);
setValue("dh-facebook",profile.facebook);
setValue("dh-gioithieu",profile.gioithieu);
setValue("dh-created",formatDateTime(profile.created_at));
setValue("dh-updated",formatDateTime(profile.updated_at));
setValue("dh-status",getStatusText(profile.status ||"pending"));
const avatar = document.getElementById("dh-avatar");
if(avatar){
    avatar.src = profile.avatar || "../../images/avatar-default.png";
}
detail.style.display ="block";
detail.scrollIntoView({behavior:"smooth",block:"start"});
}

//======================================================
// SET VALUE
//======================================================

function setValue(id,value){
const element = document.getElementById(id);
if(!element){
    return;
}
element.value = value || "";
}

//======================================================
// APPROVE CUSTOMER
//======================================================

async function approveCustomer(uid){
const customer = CUSTOMERS[uid];
if(!customer){
    return;
}
const profile = customer.profile || {};
const fullname =
    profile.fullname ||
    profile.username ||
    uid;
const ok = confirm(`Duyệt hồ sơ thành viên "${fullname}"?`);
if(!ok){
    renderList();
    return;
}
try{
    const updatedAt = Date.now();
    await writeData(`customers/${uid}/profile/status`,"approved");
    await writeData(`customers/${uid}/profile/approved_at`,updatedAt);
    CUSTOMERS[uid].profile ={...profile,status:"approved",approved_at:updatedAt};
    console.log("✅ ĐÃ DUYỆT:",uid);
    renderList();
    if(
        CURRENT_UID === uid
    ){
        showProfile(uid);
    }
    alert("✅ Đã duyệt thành viên.");
}
catch(err){
    console.error("❌ DUYỆT THẤT BẠI:",err);
    alert("Không thể duyệt hồ sơ.");
    renderList();
}
}

//======================================================
// BỎ DUYỆT CUSTOMER
//======================================================

async function unapproveCustomer(uid){

    const customer = CUSTOMERS[uid];

    if(!customer){
        return;
    }

    const profile = customer.profile || {};

    const fullname =
        profile.fullname ||
        profile.username ||
        uid;

    const ok = confirm(
        `Bỏ duyệt hồ sơ thành viên "${fullname}"?`
    );

    if(!ok){

        renderList();

        if(CURRENT_UID === uid){
            showProfile(uid);
        }

        return;
    }

    try{

        const updatedAt = Date.now();

        await writeData(
            `customers/${uid}/profile/status`,
            "pending"
        );

        await writeData(
            `customers/${uid}/profile/updated_at`,
            updatedAt
        );

        /*
         * Xóa thời điểm duyệt cũ
         */
        await writeData(
            `customers/${uid}/profile/approved_at`,
            null
        );

        CUSTOMERS[uid].profile = {
            ...profile,
            status: "pending",
            updated_at: updatedAt,
            approved_at: null
        };

        console.log("↩️ ĐÃ BỎ DUYỆT:",uid);

        renderList();

        if(CURRENT_UID === uid){
            showProfile(uid);
        }

        alert("⏳ Đã chuyển thành Chờ Admin duyệt.");

    }
    catch(err){

        console.error(
            "❌ BỎ DUYỆT THẤT BẠI:",
            err
        );

        alert(
            "Không thể bỏ duyệt hồ sơ."
        );

        renderList();

        if(CURRENT_UID === uid){
            showProfile(uid);
        }

    }

}

//======================================================
// CLOSE DETAIL
//======================================================

function closeDetail(){
const detail = document.getElementById("duyet-hoso-detail");
if(detail){
    detail.style.display ="none";
}
CURRENT_UID = null;
}

//======================================================
// BIND EVENTS
//======================================================

function bindEvents(){
document.getElementById("btn-close-duyet-detail")?.addEventListener("click",closeDetail);
}

//======================================================
// FORMAT DATE
//======================================================

function formatDateTime(timestamp){
if(!timestamp){
    return "";
}
const date = new Date(Number(timestamp));
if(
    Number.isNaN(
        date.getTime()
    )
){
    return "";
}

return date.toLocaleString(
    "vi-VN"
);
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
