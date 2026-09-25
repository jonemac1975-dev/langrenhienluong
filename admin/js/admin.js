//======================================================
// HIENLUONG WEBSITE
// File : admin.js
//======================================================


import {getAuth} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {app} from "../../scripts/firebaseConfig.js";


if (sessionStorage.getItem("adminLogin") !== "1") {
    location.href = "adminlogin.html";
    throw new Error("Not Login");
}

const auth = getAuth(app);

//======================================================
// QUYỀN ADMIN HIỆN TẠI
//======================================================

let ADMIN_CLAIMS = null;

auth.onAuthStateChanged(async (user) => {

    if(user){
        bindMenu();
        bindHeader();
        await applyAdminPermissions();
        await checkSuperAdmin();
    }
    else{
        console.warn("⚠️ CHƯA CÓ FIREBASE USER");
    }
});


async function init(){

    bindMenu();
    bindHeader();
    await applyAdminPermissions();

}


async function applyAdminPermissions(){

    const user = auth.currentUser;
    if(!user){
        console.warn("⚠️ CHƯA CÓ FIREBASE USER ĐỂ KIỂM TRA QUYỀN");
        return;
    }
    try{
        const tokenResult = await user.getIdTokenResult(true);
        const claims = tokenResult.claims;
        ADMIN_CLAIMS = claims;

//======================================================
// LƯU FIREBASE ID TOKEN CHO PAGES FUNCTION
//======================================================

const idToken = await user.getIdToken();
const cookieSecure = location.protocol === "https:" ? "; Secure" : "";
document.cookie =
    "hl_admin_token=" +
    encodeURIComponent(idToken) +
    "; path=/" +
    cookieSecure +
    "; SameSite=Lax";

        //==================================================
        // SUPER ADMIN
        //==================================================

        if(
            claims.admin === true &&
            claims.role === "superadmin"
        ){
            loadPage("gioithieu");
            return;
        }

        //==================================================
        // ADMIN THƯỜNG
        //==================================================

        const permissions = claims.permissions || {};
        document
            .querySelectorAll(".ad-menu")
            .forEach(menu => {
                const page = menu.dataset.page;

                if(
                    permissions[page] === true
                ){
                    menu.style.display = "";
                }
                else{
                    menu.style.display = "none";
                }
            });

        //==================================================
        // TÌM MENU ĐẦU TIÊN ĐƯỢC CẤP QUYỀN
        //==================================================

        const firstAllowed =
            Array.from(
                document.querySelectorAll(".ad-menu")
            ).find(menu => {

                const page =
                    menu.dataset.page;

                return (
                    menu.style.display !== "none" &&
                    permissions[page] === true
                );

            });

        if(firstAllowed){
            firstAllowed.classList.add("active");

            loadPage(firstAllowed.dataset.page);

        }
        else{
            const container = document.getElementById("admin-content");
            if(container){
                container.innerHTML = `
                    <div style="padding:30px;text-align:center;">
                        <h3>🔒 Tài khoản chưa được cấp quyền</h3>
                        <p>Vui lòng liên hệ Super Admin để được cấp quyền.</p>
                    </div>
                `;

            }

            console.warn("⚠️ ADMIN CHƯA ĐƯỢC CẤP QUYỀN NÀO");
        }
    }
    catch(error){
        console.error("❌ LỖI ÁP DỤNG PHÂN QUYỀN:",error);
    }
}


async function checkSuperAdmin(){

    const button = document.getElementById("btn-permissions");
    if(!button){
        return;
    }
    try{
        const user = auth.currentUser;
        if(!user){
            console.warn("⚠️ CHƯA CÓ FIREBASE USER");
            return;
        }
        const tokenResult = await user.getIdTokenResult(true);
        const claims = tokenResult.claims;

        if(
            claims.admin === true &&
            claims.role === "superadmin"
        ){

            button.style.display = "inline-block";
        }
        else{
            button.style.display = "none";
        }
    }
    catch(error){
        console.error("❌ LỖI KIỂM TRA SUPER ADMIN:",error);
    }
}



//======================================================

function bindMenu(){

    document.querySelectorAll(".ad-menu").forEach(btn=>{
btn.onclick=()=>{

    const page = btn.dataset.page;

    //==================================================
    // CHẶN CLICK MENU KHÔNG CÓ QUYỀN
    //==================================================

    if(
    ADMIN_CLAIMS &&
    ADMIN_CLAIMS.role !== "superadmin" &&
    (
        ADMIN_CLAIMS.admin !== true ||
        ADMIN_CLAIMS.permissions?.[page] !== true
    )
){
    const container = document.getElementById("admin-content");
    if(container){
        container.innerHTML = `
            <div style="padding:30px;text-align:center;">
                <h3>🔒 Tài khoản chưa được cấp quyền</h3>
                <p>Vui lòng liên hệ Super Admin để được cấp quyền.</p>
            </div>
        `;
    }

    return;
}

    document.querySelectorAll(".ad-menu")
        .forEach(m=>m.classList.remove("active"));
    btn.classList.add("active");
    loadPage(page);
};
    });

}
//======================================================

function bindHeader(){

    document.getElementById("btn-home")?.addEventListener("click",()=>{
        location.href="../../index.html";
    });

    document.getElementById("btn-change").onclick=()=>{
        location.href="adminchange.html";
    };

    document.getElementById("btn-permissions")?.addEventListener("click",()=>{
    loadPage("capquyen");
});

}

//======================================================

async function loadPage(page){

//======================================================
// KIỂM TRA QUYỀN TRƯỚC KHI LOAD MODULE
//======================================================

if(
    ADMIN_CLAIMS &&
    ADMIN_CLAIMS.role !== "superadmin" &&
    (
        ADMIN_CLAIMS.admin !== true ||
        ADMIN_CLAIMS.permissions?.[page] !== true
    )
){

    console.warn("🚫 KHÔNG CÓ QUYỀN LOAD MODULE:",page);

    const container =
        document.getElementById("admin-content");

    if(container){
        container.innerHTML = `
            <div style="padding:30px;text-align:center;">
                <h3>🔒 Không có quyền truy cập</h3>
                <p>Tài khoản của anh chưa được cấp quyền cho chức năng này.</p>
            </div>
        `;

    }

    return;
}

const container=document.getElementById("admin-content");
if(!container)return;

try{

const html=await fetch(`/admin/tab/${page}.html`);
if(!html.ok){
throw new Error(
"Không tìm thấy: /admin/tab/"+page+".html"
);
}

container.innerHTML=await html.text();
const module=await import(`./${page}.js?t=${Date.now()}`);

if(module.init){
module.init();
}
}

catch(err){
console.error(err);
container.innerHTML="<h3>Không tải được dữ liệu.</h3>";
}
}