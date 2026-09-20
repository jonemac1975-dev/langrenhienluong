/*======================================================
HIỀN LƯƠNG
FILE : /admin/js/duyethoso.js
MODULE : DUYỆT HỒ SƠ THÀNH VIÊN
======================================================*/

import {readData,writeData} from "../../scripts/firebaseService.js";

//======================================================
// SHA-256
//======================================================

async function hashPassword(password){

    const encoder = new TextEncoder();

    const data = encoder.encode(password);

    const hashBuffer =
        await crypto.subtle.digest(
            "SHA-256",
            data
        );

    return Array
        .from(new Uint8Array(hashBuffer))
        .map(
            b =>
                b.toString(16).padStart(2,"0")
        )
        .join("");
}
//======================================================
// BIẾN
//======================================================

let CUSTOMERS = {};
let CURRENT_UID = null;

//======================================================
// INIT
//======================================================

export async function init(){
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
const hasUpdate =
    profile.updated_at &&
    (
        !profile.admin_checked_at ||
        Number(profile.updated_at) > Number(profile.admin_checked_at)
    );
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

    ${
        hasUpdate
        ? `<span
            class="duyet-update-badge"
            title="Hồ sơ đã được thành viên cập nhật">
            🔔 Có cập nhật
           </span>`
        : ""
    }
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
<td>
    <button
        type="button"
        class="duyet-reset"
        data-id="${uid}">
        🔐 Reset
    </button>
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

function bindListEvents(){

    //======================================================
    // XEM HỒ SƠ
    //======================================================

    document.querySelectorAll(".duyet-view").forEach(button=>{

        button.onclick = ()=>{

            const uid = button.dataset.id;

            showProfile(uid);
        };

    });


    //======================================================
    // DUYỆT / BỎ DUYỆT
    //======================================================

    document.querySelectorAll(".duyet-check").forEach(check=>{

        check.onchange = ()=>{

            const uid = check.dataset.id;

            if(check.checked){

                approveCustomer(uid);

            }else{

                unapproveCustomer(uid);

            }

        };

    });


    //======================================================
    // RESET TÀI KHOẢN
    //======================================================

    document.querySelectorAll(".duyet-reset").forEach(button=>{

        button.onclick = ()=>{

            const uid = button.dataset.id;

            const customer = CUSTOMERS[uid];

            if(!customer){

                alert(
                    "Không tìm thấy thông tin thành viên!"
                );

                return;
            }

            const profile =
                customer.profile || {};


            //==================================================
            // ĐIỀN UID
            //==================================================

            document.getElementById(
                "reset-uid"
            ).value = uid;


            //==================================================
            // ĐIỀN USERNAME
            //==================================================

            document.getElementById(
                "reset-username"
            ).value =
                profile.username ||
                customer.username ||
                "";


            //==================================================
            // XÓA PASSWORD CŨ
            //==================================================

            document.getElementById(
                "reset-password"
            ).value = "";

            document.getElementById(
                "reset-password-confirm"
            ).value = "";


            //==================================================
            // XÓA THÔNG BÁO
            //==================================================

            document.getElementById(
                "reset-password-message"
            ).textContent = "";


            //==================================================
            // MỞ MODAL
            //==================================================

            document.getElementById(
                "duyet-reset-modal"
            ).style.display = "flex";


            //==================================================
            // FOCUS PASSWORD
            //==================================================

            setTimeout(()=>{

                document.getElementById(
                    "reset-password"
                ).focus();

            },100);

        };

    });
//======================================================
// XÁC NHẬN RESET MẬT KHẨU
//======================================================

const btnConfirmReset =
    document.getElementById("btn-confirm-reset");

if(btnConfirmReset){

    btnConfirmReset.onclick = async ()=>{

        const uid =
            document.getElementById("reset-uid").value;

        const password =
            document.getElementById("reset-password").value;

        const confirmPassword =
            document.getElementById(
                "reset-password-confirm"
            ).value;

        const message =
            document.getElementById(
                "reset-password-message"
            );


        //==================================================
        // KIỂM TRA
        //==================================================

        if(!uid){

            message.textContent =
                "❌ Không xác định được tài khoản!";

            return;
        }

        if(!password){

            message.textContent =
                "❌ Vui lòng nhập mật khẩu mới!";

            return;
        }

        if(!confirmPassword){

            message.textContent =
                "❌ Vui lòng nhập lại mật khẩu!";

            return;
        }

        if(password !== confirmPassword){

            message.textContent =
                "❌ Hai mật khẩu không giống nhau!";

            return;
        }


        //==================================================
        // KHÓA NÚT
        //==================================================

        btnConfirmReset.disabled = true;

        message.textContent =
            "⏳ Đang cập nhật mật khẩu...";


        try{

            // SHA-256
            const hashpass =
                await hashPassword(password);


            // GHI FIREBASE
            await writeData(
                "users/customers/" +
                uid +
                "/hashpass",
                hashpass
            );

            message.textContent =
                "✅ Reset mật khẩu thành công!";


            // Xóa password khỏi form
            document.getElementById(
                "reset-password"
            ).value = "";

            document.getElementById(
                "reset-password-confirm"
            ).value = "";


            // Tự đóng sau 1 giây
            setTimeout(()=>{

                document.getElementById(
                    "duyet-reset-modal"
                ).style.display = "none";

            },1000);


        }catch(error){

            console.error(
                "❌ RESET PASSWORD ERROR:",
                error
            );

            message.textContent =
                "❌ Không thể reset mật khẩu!";


        }finally{

            btnConfirmReset.disabled = false;

        }

    };

}
}

//======================================================
// ĐÓNG HỘP RESET
//======================================================

function closeResetModal(){

    const modal =
        document.getElementById(
            "duyet-reset-modal"
        );

    if(!modal){
        return;
    }

    // Đóng modal
    modal.style.display = "none";

    // Xóa mật khẩu
    document.getElementById(
        "reset-password"
    ).value = "";

    document.getElementById(
        "reset-password-confirm"
    ).value = "";

    // Xóa thông báo
    document.getElementById(
        "reset-password-message"
    ).textContent = "";
}


//======================================================
// NÚT X
//======================================================

const btnCloseReset =
    document.getElementById(
        "btn-close-reset"
    );

if(btnCloseReset){

    btnCloseReset.onclick =
        closeResetModal;

}


//======================================================
// NÚT HỦY
//======================================================

const btnCancelReset =
    document.getElementById(
        "btn-cancel-reset"
    );

if(btnCancelReset){

    btnCancelReset.onclick =
        closeResetModal;

}
//======================================================
// SHOW PROFILE
//======================================================

async function showProfile(uid){
const customer = CUSTOMERS[uid];
if(!customer){
    return;
}

const profile = customer.profile || {};
CURRENT_UID = uid;

//======================================================
// ADMIN ĐÃ XEM HỒ SƠ
//======================================================

const checkedAt = Date.now();

const saveChecked = await writeData(
    `customers/${uid}/profile/admin_checked_at`,
    checkedAt
);

if(saveChecked !== false){

    CUSTOMERS[uid].profile = {
        ...profile,
        admin_checked_at: checkedAt
    };

    // Cập nhật lại danh sách để 🔔 biến mất
    renderList();

}
else{

    console.error(
        "❌ KHÔNG GHI ĐƯỢC admin_checked_at:",
        uid
    );

}

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
const adminMessage = document.getElementById("dh-admin-message");
if (adminMessage) {
    adminMessage.value = profile.adminMessage || "";
    adminMessage.disabled = profile.status === "approved";
}
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
const fullname = profile.fullname || profile.username || uid;
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
    const fullname = profile.fullname ||profile.username ||uid;
    const ok = confirm(`Bỏ duyệt hồ sơ thành viên "${fullname}"?`);
    if(!ok){
        renderList();
        if(CURRENT_UID === uid){
            showProfile(uid);
        }
        return;
    }
    try{
        const updatedAt = Date.now();
        await writeData(`customers/${uid}/profile/status`,"pending");
        await writeData(`customers/${uid}/profile/updated_at`,updatedAt);

        /*
         * Xóa thời điểm duyệt cũ
         */
        await writeData(`customers/${uid}/profile/approved_at`,null);
        CUSTOMERS[uid].profile = {...profile,status: "pending",updated_at: updatedAt,approved_at: null};
        renderList();
        if(CURRENT_UID === uid){
            showProfile(uid);
        }
        alert("⏳ Đã chuyển thành Chờ Admin duyệt.");

    }
    catch(err){
        console.error("❌ BỎ DUYỆT THẤT BẠI:",err);
        alert("Không thể bỏ duyệt hồ sơ.");
        renderList();

        if(CURRENT_UID === uid){
            showProfile(uid);
        }
    }
}

//======================================================
// GỬI THÔNG BÁO CHO THÀNH VIÊN
//======================================================

async function saveAdminMessage(){

    if(!CURRENT_UID){

        alert("⚠ Hãy chọn một thành viên trước.");

        return;

    }

    const customer =
        CUSTOMERS[CURRENT_UID];

    if(!customer){

        return;

    }

    const profile =
        customer.profile || {};

    if(profile.status === "approved"){

        alert(
            "ℹ Thành viên này đã được duyệt."
        );

        return;

    }

    const textarea =
        document.getElementById(
            "dh-admin-message"
        );

    if(!textarea){

        return;

    }

    const message =
        textarea.value.trim();

    if(!message){

        alert(
            "⚠ Vui lòng nhập nội dung thông báo."
        );

        return;

    }

    try{

        await writeData(
            `customers/${CURRENT_UID}/profile/adminMessage`,
            message
        );

        CUSTOMERS[CURRENT_UID].profile = {

            ...profile,

            adminMessage:
                message

        };

        alert(
            "📢 Đã gửi thông báo cho thành viên."
        );

    }
    catch(error){

        console.error(
            "❌ GỬI THÔNG BÁO THẤT BẠI:",
            error
        );

        alert(
            "❌ Không thể gửi thông báo."
        );

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
document.getElementById("btn-save-admin-message")?.addEventListener("click",saveAdminMessage);
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
