import {readData}from "../../scripts/firebaseService.js";

//======================================================
// INIT
//======================================================

export async function init(){
const uid = localStorage.getItem("customer_uid");
if(!uid){
    console.warn("⚠️ Không tìm thấy customer_uid");
    return;
}
await loadProfile(uid);
}

//======================================================
// LOAD PROFILE
//======================================================

async function loadProfile(uid){
try{

    const profile = await readData(`customers/${uid}/profile`);
    if(!profile){
        console.warn(
            "⚠️ Không tìm thấy hồ sơ"
        );
        return;
    }
    renderProfile(uid,profile);
}
catch(err){
    console.error("❌ LOAD HỒ SƠ ERROR:",err);
}
}

//======================================================
// RENDER PROFILE
//======================================================

function renderProfile(
uid,
profile
){


//==================================================
// TRẠNG THÁI XÉT DUYỆT
//==================================================

const status = profile.status || "pending";
const statusBox = document.getElementById("view-status");
if(statusBox){
    if(status === "approved"){
        statusBox.textContent ="✅ Thành viên chính thức";
        statusBox.className ="hosoview-status hosoview-status-approved";
    }
    else{
        statusBox.textContent ="⏳ Đang chờ xét duyệt";
        statusBox.className ="hosoview-status hosoview-status-pending";
    }
}

//==================================================
// THÔNG BÁO TỪ ADMIN
//==================================================

const adminMessageBox =
    document.getElementById(
        "view-admin-message"
    );

const adminMessageText =
    document.getElementById(
        "view-admin-message-text"
    );

const adminMessage =
    profile.adminMessage || "";

if(adminMessage.trim()){

    if(adminMessageBox){

        adminMessageBox.style.display =
            "block";

    }

    if(adminMessageText){

        adminMessageText.textContent =
            adminMessage;

    }

}
else{

    if(adminMessageBox){

        adminMessageBox.style.display =
            "none";

    }

    if(adminMessageText){

        adminMessageText.textContent =
            "";

    }

}

//==================================================
// THÔNG TIN HỒ SƠ
//==================================================

setText("view-id",uid);
setText("view-username",profile.username);
setText("view-fullname",profile.fullname);
setText("view-gender",profile.gender);
setText("view-address",profile.address);
setText("view-nationality",profile.nationality);
setText("view-phone",profile.phone);
setText("view-gmail",profile.gmail);
setText("view-zalo",profile.zalo);
setText("view-facebook",profile.facebook);

//==================================================
// AVATAR
//==================================================

const avatar = document.getElementById("view-avatar");
if(
    avatar &&
    profile.avatar
){
    avatar.src = profile.avatar;
    avatar.style.display = "block";
}
else if(avatar){
    avatar.style.display = "none";
}
}

//======================================================
// SET TEXT
//======================================================

function setText(id,value){
const el = document.getElementById(id);
if(!el){
    return;
}
el.textContent = value || "";
}
