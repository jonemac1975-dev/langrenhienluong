//======================================================
// HIENLUONG
// adminchange.js
//======================================================

import {getAuth,signInWithEmailAndPassword,updatePassword} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {app} from "../../scripts/firebaseConfig.js";

const auth = getAuth(app);
document.addEventListener("DOMContentLoaded",init);

//======================================================

function init(){
    document.getElementById("btn-ok").onclick = changePassword;
    document.getElementById("btn-cancel").onclick = ()=>{location.href="admin.html";
    };
}

//======================================================

async function changePassword(){

    const oldPass =
        document.getElementById("old-pass")
        .value
        .trim();

    const newPass =
        document.getElementById("new-pass")
        .value
        .trim();

    const confirmPass =
        document.getElementById("confirm-pass")
        .value
        .trim();

    if(
        !oldPass ||
        !newPass ||
        !confirmPass
    ){

        alert(
            "Nhập đầy đủ thông tin."
        );

        return;
    }

    if(
        newPass !== confirmPass
    ){

        alert(
            "Xác nhận mật khẩu không đúng."
        );

        return;
    }

    if(
        newPass.length < 6
    ){

        alert(
            "Mật khẩu mới phải có ít nhất 6 ký tự."
        );

        return;
    }

    try{

        const user =
            auth.currentUser;

        if(!user){

            alert(
                "Phiên đăng nhập đã hết. Vui lòng đăng nhập lại."
            );

            location.href =
                "adminlogin.html";

            return;
        }

        await signInWithEmailAndPassword(
            auth,
            user.email,
            oldPass
        );

        await updatePassword(
            auth.currentUser,
            newPass
        );

        alert(
            "Đổi mật khẩu thành công."
        );

        location.href =
            "admin.html";

    }
    catch(error){

        console.error(
            "❌ FIREBASE CHANGE PASSWORD ERROR:",
            error
        );

        if(
            error.code ===
            "auth/wrong-password" ||
            error.code ===
            "auth/invalid-credential"
        ){

            alert(
                "Mật khẩu cũ không đúng."
            );

            return;
        }

        if(
            error.code ===
            "auth/weak-password"
        ){

            alert(
                "Mật khẩu mới quá yếu."
            );

            return;
        }

        if(
            error.code ===
            "auth/requires-recent-login"
        ){

            alert(
                "Phiên đăng nhập đã cũ. Vui lòng đăng nhập lại rồi đổi mật khẩu."
            );

            return;
        }

        alert(
            "Đổi mật khẩu thất bại."
        );
    }
}
