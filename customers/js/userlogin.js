import {readData} from "../../scripts/firebaseService.js";
// ============================
// SHA256
// ============================

async function hashPassword(password){
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256",data);
    return Array
        .from(
            new Uint8Array(hashBuffer)
        )
        .map(
            b =>
            b.toString(16)
            .padStart(2,"0")
        )
        .join("");
}

// ============================
// LOGIN
// ============================

async function login(){
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;
    if(!username || !password){
        alert("Vui lòng nhập đầy đủ!");
        return;
    }
    const hashpass = await hashPassword(password);
    const users = await readData("users/customers");
    let found = null;
    if(users){
        for(
            const id in users
        ){
            const user = users[id];
            if(
                user.username === username
                &&
                user.hashpass === hashpass
            ){

                found = {
                    id,
                    ...user
                };

                break;
            }
        }
    }
    if(!found){
        alert("Sai tên đăng nhập hoặc mật khẩu!");
        return;
    }
    // lưu phiên đăng nhập

    localStorage.setItem("customer_uid", found.id);
    localStorage.setItem("customer_username", found.username);
    localStorage.setItem("customer_login", "true");
    window.location.href ="customers.html";
}

// ============================
// EVENT
// ============================

document.getElementById("btn-login").onclick =login;
document.getElementById("btn-cancel").onclick =()=>{history.back();
};