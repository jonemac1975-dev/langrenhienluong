
//======================================================
// HIENLUONG WEBSITE
// File : capquyen.js
// Quản lý Admin - Tạo Admin mới
//======================================================


import {getAuth} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {app} from "../../scripts/firebaseConfig.js";


//======================================================
// FIREBASE AUTH
//======================================================

const auth = getAuth(app);


//======================================================
// INIT
//======================================================

export function init(){

    loadAdminList();
    const button = document.getElementById("btn-save-admin");
    if(!button){
        console.warn("⚠️ KHÔNG TÌM THẤY NÚT TẠO ADMIN");
        return;
    }
    button.onclick = createAdmin;
const deleteButton = document.getElementById("btn-delete-admin");

if(deleteButton){
    deleteButton.onclick = deleteAdmin;
}
}

async function loadAdminList(){

    const select = document.getElementById("admin-select");
    if(!select){

        console.warn("⚠️ KHÔNG TÌM THẤY SELECT ADMIN");
        return;
    }

    const user = auth.currentUser;
    if(!user){
        console.warn("⚠️ CHƯA CÓ FIREBASE USER");
        return;
    }

    try{
        const token = await user.getIdToken(true);
        const response =
            await fetch(
                "https://hienluong-auth-test.jonemac1975.workers.dev/admin/list",
                {
                    method: "GET",
                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );

        const resultText = await response.text();

let result;

try{

    result = JSON.parse(resultText);

}
catch(error){

    throw new Error(
        "Worker không trả JSON:\n\n" +
        resultText
    );

}

        if(
            !response.ok ||
            !result.success
        ){

            throw new Error(
                result.error ||
                "Không lấy được danh sách Admin"
            );
        }


        //==============================================
        // GIỮ OPTION TẠO ADMIN MỚI
        //==============================================

        select.innerHTML = `<option value="">➕ Tạo Admin mới </option>`;


        //==============================================
        // THÊM ADMIN
        //==============================================

        result.admins.forEach(admin => {
            const option = document.createElement("option");
            option.value = admin.uid;
            option.textContent = admin.email;
            select.appendChild(option);
        });

        window.__ADMIN_LIST__ = result.admins;
            }
    catch(error){
        console.error("❌ LỖI LOAD ADMIN:",error);
    }
}

//======================================================
// CHỌN ADMIN → HIỆN THÔNG TIN
//======================================================

document.addEventListener(
    "change",
    function(event){

        if(
            event.target.id !==
            "admin-select"
        ){
            return;
        }

        const uid = event.target.value;
        const nameInput = document.getElementById("admin-name");
        const emailInput = document.getElementById("admin-email");
        const deleteButton = document.getElementById("btn-delete-admin");

        //==============================================
        // TẠO ADMIN MỚI
        //==============================================

        if(!uid){

    if(deleteButton){
        deleteButton.style.display = "none";
    }

    if(nameInput){
        nameInput.value = "";
    }

            if(emailInput){
                emailInput.value = "";
            }

            document
                .querySelectorAll(
                    "[data-permission]"
                )
                .forEach(
                    checkbox =>
                        checkbox.checked = false
                );
            return;
        }


        //==============================================
        // TÌM ADMIN
        //==============================================

        const admin = window.__ADMIN_LIST__?.find(item => item.uid === uid);
        if(!admin){
            console.warn("⚠️ KHÔNG TÌM THẤY ADMIN:",uid);
            return;
        }
if(deleteButton){
    deleteButton.style.display = "inline-block";
}

        //==============================================
        // ĐIỀN TÊN + EMAIL
        //==============================================

        if(nameInput){
            nameInput.value =
                admin.name ||
                admin.displayName ||
                "";
        }

        if(emailInput){
            emailInput.value = admin.email || "";
        }


        //==============================================
        // ĐIỀN QUYỀN
        //==============================================

        const permissions = admin.permissions ||{};
        document
            .querySelectorAll(
                "[data-permission]"
            )
            .forEach(
                checkbox => {
                    const key = checkbox.dataset.permission;
                    checkbox.checked = permissions[key] === true;
                }
            );


        //==============================================
        // PASSWORD
        //==============================================

        const passwordInput = document.getElementById("admin-pass");
        if(passwordInput){
            passwordInput.value = "";
        }
     }
);

//======================================================
// TẠO ADMIN
//======================================================

async function createAdmin(){

    const select = document.getElementById("admin-select");
    const uid = select?.value || "";
    const name = document.getElementById("admin-name")?.value.trim();
    const email = document.getElementById("admin-email")?.value.trim();
    const password = document.getElementById("admin-pass")?.value;


    //==================================================
    // KIỂM TRA DỮ LIỆU
    //==================================================

    if(!name){
        alert("⚠️ Vui lòng nhập tên Admin.");
        return;
    }


    if(!email){
        alert("⚠️ Vui lòng nhập Email."
        );

        return;
    }


    //==================================================
    // PASSWORD
    //==================================================

    // Tạo mới → bắt buộc password
    if(!uid && !password){

        alert("⚠️ Vui lòng nhập mật khẩu Admin."
        );
        return;
    }


    // Password có nhập → tối thiểu 6 ký tự
    if(
        password &&
        password.length < 6
    ){
        alert("⚠️ Mật khẩu phải có ít nhất 6 ký tự.");
        return;
    }


    //==================================================
    // LẤY QUYỀN
    //==================================================

    const permissions = {};


    document
        .querySelectorAll(
            "[data-permission]"
        )
        .forEach(checkbox => {

            permissions[
                checkbox.dataset.permission
            ] =
                checkbox.checked;

        });


    //==================================================
    // XÁC ĐỊNH CREATE / UPDATE
    //==================================================

    const action =
        uid
            ? "update-admin"
            : "create-admin";

    //==================================================
    // FIREBASE USER
    //==================================================

    const user = auth.currentUser;
    if(!user){
        alert("❌ Chưa đăng nhập Firebase.");
        return;
    }

    try{
        const token = await user.getIdToken(true);


        //================================================
        // GỌI WORKER
        //================================================

        const response = await fetch(
                "https://hienluong-auth-test.jonemac1975.workers.dev/admin/" +
                action,
                {
                    method:
                        "POST",
                    headers: {
                        "Authorization":
                            "Bearer " + token,
                        "Content-Type":
                            "application/json"
                    },
                    body:
                        JSON.stringify({
                            uid: uid,
                            name:name,
                            email:email,
                            password:password,
                            permissions:permissions
                        })
                }
            );

        const resultText = await response.text();


let result;

try{

    result = JSON.parse(resultText);

}
catch(error){

    throw new Error(
        "Worker không trả JSON:\n\n" +
        resultText
    );

}

        //================================================
        // XỬ LÝ LỖI
        //================================================

        if(
            !response.ok ||
            !result.success
        ){

            throw new Error(

                result.error ||
                "Không thể thực hiện."

            );

        }


        //================================================
        // THÔNG BÁO
        //================================================

        if(uid){
            alert("✅ Đã cập nhật Admin thành công.");
        }
        else{
            alert("✅ Đã tạo Admin thành công.");
        }


        //================================================
        // XÓA FORM
        //================================================

        if(select){
            select.value = "";
        }

        document
            .getElementById(
                "admin-name"
            )
            .value = "";

        document
            .getElementById(
                "admin-email"
            )
            .value = "";

        document
            .getElementById(
                "admin-pass"
            )
            .value = "";

        document
            .querySelectorAll(
                "[data-permission]"
            )
            .forEach(
                checkbox =>
                    checkbox.checked = false
            );


        //================================================
        // LOAD LẠI DANH SÁCH
        //================================================

        await loadAdminList();


    }
    catch(error){
        console.error(
            "❌ LỖI ADMIN:",
            error
        );
        alert("❌ Không thể thực hiện.\n\n" + error.message);
    }
}

async function deleteAdmin(){

    const select = document.getElementById("admin-select");
    const uid = select?.value || "";

    if(!uid){
        alert("⚠️ Vui lòng chọn Admin cần xóa.");
        return;
    }

    const admin = window.__ADMIN_LIST__?.find(
        item => item.uid === uid
    );

    if(!admin){
        alert("❌ Không tìm thấy Admin được chọn.");
        return;
    }

    const adminName =
        admin.name ||
        admin.displayName ||
        admin.email ||
        "Admin";

    const confirmed = confirm(
        "⚠️ BẠN CÓ CHẮC MUỐN XÓA ADMIN NÀY?\n\n" +
        "Tên: " + adminName + "\n" +
        "Email: " + (admin.email || "") +
        "\n\nTài khoản sẽ bị xóa khỏi Firebase."
    );

    if(!confirmed){
        return;
    }

    const user = auth.currentUser;

    if(!user){
        alert("❌ Chưa đăng nhập Firebase.");
        return;
    }

    try{

        const token = await user.getIdToken(true);

        const response = await fetch(
            "https://hienluong-auth-test.jonemac1975.workers.dev/admin/delete-admin",
            {
                method: "POST",
                headers: {
                    "Authorization":
                        "Bearer " + token,
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    uid: uid
                })
            }
        );

        const result = await response.json();


        if(
            !response.ok ||
            !result.success
        ){

            throw new Error(
                result.error ||
                "Không thể xóa Admin."
            );

        }

        alert(
            "✅ Đã xóa Admin thành công.\n\n" +
            (result.email || admin.email || "")
        );

        //==================================================
        // RESET FORM
        //==================================================

        if(select){
            select.value = "";
        }

        const nameInput =
            document.getElementById("admin-name");

        const emailInput =
            document.getElementById("admin-email");

        const passwordInput =
            document.getElementById("admin-pass");

        if(nameInput){
            nameInput.value = "";
        }

        if(emailInput){
            emailInput.value = "";
        }

        if(passwordInput){
            passwordInput.value = "";
        }

        document
            .querySelectorAll("[data-permission]")
            .forEach(checkbox => {
                checkbox.checked = false;
            });

        const deleteButton =
            document.getElementById("btn-delete-admin");

        if(deleteButton){
            deleteButton.style.display = "none";
        }

        //==================================================
        // LOAD LẠI DANH SÁCH
        //==================================================

        await loadAdminList();

    }
    catch(error){

        console.error(
            "❌ LỖI XÓA ADMIN:",
            error
        );

        alert(
            "❌ Không thể xóa Admin.\n\n" +
            error.message
        );

    }

}