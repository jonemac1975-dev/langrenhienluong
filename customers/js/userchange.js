import {readData,updateData} from "../../scripts/firebaseService.js";



// SHA256

async function hashPassword(password){

    const encoder =
        new TextEncoder();


    const data =
        encoder.encode(password);



    const hashBuffer =
        await crypto.subtle.digest(
            "SHA-256",
            data
        );



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



// ========================
// UPDATE ACCOUNT
// ========================


async function changeAccount(){


    const uid = localStorage.getItem("customer_id");
    if(!uid){

        alert("Bạn chưa đăng nhập!");
        location.href = "userlogin.html";
        return;
    }
    const oldUsername = document.getElementById("old-username").value.trim();
    const oldPassword = document.getElementById("old-password").value;
    const newUsername = document.getElementById("new-username").value.trim();
    const newPassword = document.getElementById("new-password").value;
    const confirm = document.getElementById("confirm-password").value;
    if(
        !oldUsername ||
        !oldPassword ||
        !newUsername ||
        !newPassword
    ){

        alert("Vui lòng nhập đầy đủ!");
        return;
    }
    if(
        newPassword !== confirm
    ){
       alert("Xác nhận mật khẩu sai!");
        return;
    }
    const user = await readData("users/customers/"+uid);
    if(!user){
        alert("Không tìm thấy tài khoản!");
        return;
    }

    const oldHash = await hashPassword(oldPassword);
    if(
        user.username !== oldUsername
        ||
        user.hashpass !== oldHash
    ){
        alert("Thông tin tài khoản cũ không đúng!");
        return;
    }
    const allUsers = await readData("users/customers");
    for(
        const id in allUsers
    ){

        if(
            id !== uid &&
            allUsers[id].username
            === newUsername
        ){

            alert("Tên đăng nhập mới đã tồn tại!");
            return;
        }
    }

    const newHash = await hashPassword(newPassword);
    await updateData("users/customers/"+uid,{username:newUsername,hashpass:newHash});
    localStorage.setItem("customer_username",newUsername);
    alert("Cập nhật thành công!");
    location.href = "customers.html";
}
document.getElementById("btn-change").onclick = changeAccount;
document.getElementById("btn-cancel").onclick =()=>{history.back();
};