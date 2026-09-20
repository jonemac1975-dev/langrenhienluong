import {readData,writeData} from "../../scripts/firebaseService.js";
import {compressImage} from "../../scripts/compressImage.js";

//======================================================
// USER
//======================================================

let CUSTOMER_UID = null;
let PROFILE = null;
let AVATAR_BASE64 = "";

//======================================================
// INIT
//======================================================

document.addEventListener("DOMContentLoaded", init);

//======================================================
// INIT
//======================================================

export async function init(){
   
    CUSTOMER_UID = localStorage.getItem("customer_uid");
    if(!CUSTOMER_UID){
        alert("Không tìm thấy thông tin thành viên.");
        return;
    }

    await loadProfile();
    renderProfile();
    bindEvents();
}

//======================================================
// LOAD PROFILE
//======================================================

async function loadProfile(){

    try{
        PROFILE = await readData(`customers/${CUSTOMER_UID}/profile`);
        if(!PROFILE){
            PROFILE = {};
        }

        //================================================
        // AVATAR
        //================================================

        AVATAR_BASE64 = PROFILE.avatar || "";
        }
    catch(err){
        console.error("❌ LOAD PROFILE ERROR:", err);
        PROFILE = {};
        AVATAR_BASE64 = "";
    }
}

//======================================================
// RENDER STATUS
//======================================================

function renderStatus(){

    const statusBox = document.getElementById("hoso-status");

    if(!statusBox){
        return;
    }

    const status = PROFILE?.status || "pending";
    if(status === "approved"){
        statusBox.textContent = "✅ Thành viên chính thức";
        statusBox.className = "hoso-status hoso-status-approved";
    }else{
        statusBox.textContent = "⏳ Đang chờ xét duyệt";
        statusBox.className = "hoso-status hoso-status-pending";
    }
}

//======================================================
// RENDER PROFILE
//======================================================

function renderProfile(){
renderStatus();
    const idBox = document.getElementById("hoso-id");
    const usernameBox = document.getElementById("hoso-username");
    
    if(idBox){
        idBox.value = String(CUSTOMER_UID);
        idBox.disabled = true;
    }

    if(usernameBox){
        usernameBox.value = PROFILE.username || "";
        usernameBox.disabled = true;
    }

    //==================================================
    // THÔNG TIN
    //==================================================

    document.getElementById("hoso-name").value = PROFILE.fullname || "";
    document.getElementById("hoso-address").value = PROFILE.address || "";
    document.getElementById("hoso-nationality").value = PROFILE.nationality || "";
    document.getElementById("hoso-phone").value = PROFILE.phone || "";
    document.getElementById("hoso-gmail").value = PROFILE.gmail || "";
    document.getElementById("hoso-zalo").value = PROFILE.zalo || "";
    document.getElementById("hoso-facebook").value = PROFILE.facebook || "";
    document.getElementById("hoso-gioithieu").value = PROFILE.gioithieu || "";

    //==================================================
    // GIỚI TÍNH
    //==================================================

    if(PROFILE.gender === "Nam"){document.getElementById("hoso-male").checked = true;
    }
    if(PROFILE.gender === "Nữ"){document.getElementById("hoso-female").checked = true;
    }

    //==================================================
    // AVATAR PREVIEW
    //==================================================

    if(AVATAR_BASE64){showAvatar(AVATAR_BASE64);
    }
}

//======================================================
// BIND EVENTS
//======================================================

function bindEvents(){

    //==================================================
    // LƯU
    //==================================================

    const save = document.getElementById("btn-save");
    if(save){
        save.onclick = saveProfile;
    }


    //==================================================
    // TRANG CỦA TÔI
    //==================================================

    const myPage = document.getElementById("btn-my-page");
    if(myPage){
        myPage.onclick = function(){window.location.href ="customers.html";
         };
    }

    //==================================================
    // HOME
    //==================================================

    const home = document.getElementById("btn-hoso-home");
    if(home){
        home.onclick = function(e){e.preventDefault();
        window.location.href ="../../index.html";
            };
    }


    //==================================================
    // CHỌN AVATAR
    //==================================================

    const imageFile = document.getElementById("hoso-image-file");
    if(imageFile){
        imageFile.onchange = handleAvatar;
    }
}

//======================================================
// HANDLE AVATAR
// NÉN AVATAR TRƯỚC KHI LƯU FIREBASE
//======================================================

async function handleAvatar(e){

    const file =
        e.target.files?.[0];

    if(!file){
        return;
    }

    //==================================================
    // KIỂM TRA FILE
    //==================================================

    if(
        !file.type.startsWith("image/")
    ){

        alert(
            "Vui lòng chọn file hình ảnh."
        );

        e.target.value = "";

        return;
    }

    //==================================================
    // NÉN AVATAR
    //==================================================

    try{

        const base64 =
            await compressImage(
                file,
                "avatar"
            );

        //================================================
        // LƯU AVATAR
        //================================================

        AVATAR_BASE64 =
            base64;

        //================================================
        // PREVIEW
        //================================================

        showAvatar(
            AVATAR_BASE64
        );
    }
    catch(error){

        console.error(
            "❌ COMPRESS AVATAR ERROR:",
            error
        );

        alert(
            error.message ||
            "Không thể xử lý avatar."
        );

        e.target.value = "";

    }

}

//======================================================
// SHOW AVATAR
//======================================================

function showAvatar(src){
    const preview = document.getElementById("hoso-preview");
    if(!preview){
        console.warn("⚠️ Không tìm thấy #hoso-preview");
        return;
    }
    preview.src = src;
    preview.style.display = "block";
}

//======================================================
// SAVE PROFILE
//======================================================

async function saveProfile(){
    if(!CUSTOMER_UID){
        alert("Không xác định được thành viên.");
        return;
    }
    const fullname = document.getElementById("hoso-name").value.trim();
    if(!fullname){
        alert("Vui lòng nhập Họ và tên.");
        document.getElementById("hoso-name").focus();
        return;
    }
    const gender = document.querySelector('input[name="gender"]:checked')?.value || "";
    const address = document.getElementById("hoso-address").value.trim();
    const nationality = document.getElementById("hoso-nationality").value.trim();
    const phone = document.getElementById("hoso-phone").value.trim();
    const gmail = document.getElementById("hoso-gmail").value.trim();
    const zalo = document.getElementById("hoso-zalo").value.trim();
    const facebook = document.getElementById("hoso-facebook").value.trim();
    const gioithieu = document.getElementById("hoso-gioithieu").value.trim();

    //==================================================
    // DATA
    //==================================================

    const data = {
        username:
            PROFILE.username || "",
        created_at:
            PROFILE.created_at ||
           Date.now(),
        fullname,
        gender,
        address,
        nationality,
        phone,
        gmail,
        zalo,
        facebook,
        gioithieu,

        // Avatar mới hoặc avatar cũ
        avatar:
            AVATAR_BASE64 || "",
// Giữ nguyên trạng thái xét duyệt
    status:
        PROFILE.status || "pending",
        updated_at:
            Date.now()
    };

    try{
        await writeData(`customers/${CUSTOMER_UID}/profile`, data);
        PROFILE = data;


        //================================================
        // LOCAL STORAGE
        //================================================

        localStorage.setItem("customer_avatar", AVATAR_BASE64 || "");
        localStorage.setItem("customer_username", data.username || "");
        alert("Lưu hồ sơ thành công!");
    }
    catch(err){
        console.error("❌ SAVE PROFILE ERROR:",err);
        alert("Không thể lưu hồ sơ. Vui lòng thử lại.");
    }
}