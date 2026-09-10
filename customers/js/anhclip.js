import {readData,writeData} from "../../scripts/firebaseService.js";

console.log("🔥 userregister.js loaded");
// ===============================
// SHA 256
// ===============================

async function hashPassword(password){
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256",data);
    return Array
        .from(new Uint8Array(hashBuffer))
        .map(
            b => b.toString(16).padStart(2,"0")
        )
        .join("");
}

// ===============================
// TẠO ID USER
// ===============================

async function createUserID(){
   const data = await readData("users/customers");
    let max = 0;
    if(data){
        Object.keys(data)
        .forEach(id=>{
            const num = parseInt(id.replace("user",""));
            if(num > max) max=num;
        });
    }

    return "user" +
        String(max+1)
        .padStart(3,"0");
}


// ===============================
// REGISTER
// ===============================

async function register(){
    const username = document.getElementById("reg-username").value.trim();
    const password = document.getElementById("reg-password").value;
    const confirm = document.getElementById("reg-confirm").value;
    if(!username || !password){
        alert("Vui lòng nhập đầy đủ!");
        return;
    }

    if(password !== confirm){
        alert("Mật khẩu xác nhận không đúng!");
        return;
    }

    // kiểm tra username
    const users =await readData("users/customers");
    if(users){
        for(
            const id in users
        ){
            if(
                users[id].username
                === username
            ){
                alert("Tên đăng ký đã tồn tại!");
                return;
            }
        }

    }

    const uid = await createUserID();
    const hashpass = await hashPassword(password);
    const time = Date.now();
    // user login
    	await writeData("users/customers/"+uid,{username,hashpass,created_at:time});
	await writeData("customers/"+uid+"/profile",{username,created_at:time,avatar:""});
localStorage.setItem("customer_uid",uid);
alert("Đăng ký thành công!");
window.location.href="hoso.html";
}

// ===============================
// EVENT
// ===============================

document.getElementById("btn-register").onclick =register;
document.getElementById("btn-cancel").onclick =()=>{history.back();
};
