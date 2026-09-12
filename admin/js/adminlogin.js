//======================================================
// HIENLUONG
// adminlogin.js
//======================================================

import { readData }from "../../scripts/firebaseService.js";
document.addEventListener("DOMContentLoaded",init);

//======================================================

function init(){
    document.getElementById("btn-login").onclick=login;
    document.getElementById("btn-cancel").onclick=()=>{location.href="../../index.html";
    };
}

//======================================================

async function login(){
    const password = document.getElementById("admin-pass").value.trim();
    if(!password){alert("Nhập mật khẩu.");
        return;
    }

    //-----------------------------------
    // SHA-256
    //-----------------------------------

    const hash = await sha256(password);

    //-----------------------------------
    // đọc Firebase
    //-----------------------------------

    const hashPass = await readData("users/admin/hashpass");
    if(!hashPass){alert("Không tìm thấy mật khẩu Admin.");
        return;
    }

    if(hash !== hashPass){alert("Sai mật khẩu.");
        return;
    }

    //-----------------------------------
    // Login OK
    //-----------------------------------

    sessionStorage.setItem("adminLogin","1");
    location.href = "admin.html";

}

//======================================================

async function sha256(text){
    const msgUint8= new TextEncoder().encode(text);
    const hashBuffer= await crypto.subtle.digest("SHA-256", msgUint8 );
    const hashArray= Array.from( new Uint8Array(hashBuffer));
    return hashArray
    .map(
    b=>b.toString(16)
    .padStart(2,"0")
    )
    .join("");
}