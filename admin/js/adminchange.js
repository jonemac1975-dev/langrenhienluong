//======================================================
// HIENLUONG
// adminchange.js
//======================================================

import {readData,writeData}from "../../scripts/firebaseService.js";
document.addEventListener("DOMContentLoaded",init);

//======================================================

function init(){
    document.getElementById("btn-ok").onclick = changePassword;
    document.getElementById("btn-cancel").onclick = ()=>{location.href="admin.html";
    };
}

//======================================================

async function changePassword(){
    const oldPass = document.getElementById("old-pass").value.trim();
    const newPass = document.getElementById("new-pass").value.trim();
    const confirmPass = document.getElementById("confirm-pass").value.trim();
    if(
        !oldPass ||
        !newPass ||
        !confirmPass
    ){
        alert("Nhập đầy đủ thông tin.");
        return;
    }
    if(
        newPass !== confirmPass
    ){
        alert("Xác nhận mật khẩu không đúng.");
        return;
    }
    const oldHash = await sha256(oldPass);
    const currentHash = await readData("users/admin/hashpass");
    if(
        oldHash !== currentHash
    ){
        alert("Mật khẩu cũ không đúng.");
        return;
    }
    const newHash = await sha256(newPass);
    await writeData("users/admin/hashpass",newHash);
    alert("Đổi mật khẩu thành công.");
    location.href="admin.html";
}

//======================================================

async function sha256(text){
    const msg = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256",msg);
    return Array
    .from(
        new Uint8Array(hash)
    )
    .map(
        b=>b
        .toString(16)
        .padStart(2,"0")
    )
    .join("");
}