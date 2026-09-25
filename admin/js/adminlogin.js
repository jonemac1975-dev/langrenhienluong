//======================================================
// HIENLUONG
// adminlogin.js
//======================================================

import {getAuth,signInWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { app } from "../../scripts/firebaseConfig.js";

const auth = getAuth(app);

document.addEventListener("DOMContentLoaded",init);

//======================================================
// WORKER
//======================================================

const AUTH_WORKER ="https://hienluong-auth-test.jonemac1975.workers.dev";


//======================================================
// LOAD ADMIN LIST
//======================================================

async function loadAdminList(){

    const select = document.getElementById("admin-account");
    if(!select) return;
    try{

        const response = await fetch(AUTH_WORKER + "/admin/public-list");
        const result = await response.json();
        if(!response.ok || !result.success){
            throw new Error(
                result.error || "Không tải được danh sách Admin."
            );
        }

        select.innerHTML ='<option value="">-- Chọn tài khoản Admin --</option>';
        (result.admins || []).forEach(admin => {
            const option = document.createElement("option");
            option.value = admin.email;
            option.textContent = admin.name? `${admin.name} — ${admin.email}`: admin.email;
            select.appendChild(option);

        });

    }
    catch(error){
        console.error("❌ LỖI LOAD ADMIN LIST:",error);
        alert("❌ Không tải được danh sách tài khoản Admin.");
    }
}
//======================================================
// INIT
//======================================================

function init(){

    document.getElementById("btn-login").onclick = login;
    document.getElementById("btn-cancel").onclick = () => {location.href ="../../index.html";
        };
  loadAdminList();
}


//======================================================
// LOGIN
//======================================================

async function login(){

    const account = document.getElementById("admin-account")?.value;
    const password = document.getElementById("admin-pass")?.value.trim();


    //-----------------------------------
    // KIỂM TRA TÀI KHOẢN
    //-----------------------------------

    if(!account){
        alert("Vui lòng chọn tài khoản quản trị.");
        return;
    }


    //-----------------------------------
    // KIỂM TRA PASSWORD
    //-----------------------------------

    if(!password){
        alert("Nhập mật khẩu.");
        return;
    }

    try{

        //-----------------------------------
        // FIREBASE AUTH LOGIN
        //-----------------------------------

        const credential = await signInWithEmailAndPassword(auth,account,password);
        const user = credential.user;


        //-----------------------------------
        // KIỂM TRA ADMIN CLAIM
        //-----------------------------------

        const tokenResult = await user.getIdTokenResult(true);

        if(
            tokenResult.claims.admin !== true
        ){
            alert("Tài khoản không có quyền Admin.");
            await auth.signOut();
            return;
        }


        //-----------------------------------
        // LOGIN OK
        //-----------------------------------

        sessionStorage.setItem("adminLogin","1");
        location.href = "/admin/tab/admin.html";
    }
    catch(error){
        console.error("❌ FIREBASE ADMIN LOGIN ERROR:",error);
        alert("Đăng nhập thất bại. Kiểm tra tài khoản hoặc mật khẩu.");
    }
}