import {readData,writeData} from "../../scripts/firebaseService.js";
import {compressImage} from "../../scripts/compressImage.js";
import {uploadToCloudinary} from "../../scripts/cloudinaryUpload.js";
import{getAuth}from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import{app}from "../../scripts/firebaseConfig.js";

const auth=getAuth(app);

//======================================================
// USER
//======================================================

let CUSTOMER_UID = null;
let PROFILE = null;
let AVATAR_BASE64 = "";
let AVATAR_PUBLIC_ID = "";

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
        // AVATAR CŨ
        //================================================

        AVATAR_BASE64 = "";
        AVATAR_PUBLIC_ID = PROFILE.avatar_public_id || "";

    }
    catch(err){
        console.error("❌ LOAD PROFILE ERROR:",err);

        PROFILE = {};
        AVATAR_BASE64 = "";
        AVATAR_PUBLIC_ID = "";
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

    if(PROFILE.avatar){
    showAvatar(PROFILE.avatar);
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

    const file = e.target.files?.[0];
    if(!file){
        return;
    }

    //==================================================
    // KIỂM TRA FILE
    //==================================================

    if(
        !file.type.startsWith("image/")
    ){
        alert("Vui lòng chọn file hình ảnh.");
        e.target.value = "";
        return;
    }

    //==================================================
    // NÉN AVATAR
    //==================================================

    try{
        const base64 = await compressImage(file,"avatar");

        //================================================
        // CHỈ LƯU ẢNH MỚI TẠM THỜI
        //================================================

        AVATAR_BASE64 = base64;

        //================================================
        // PREVIEW
        //================================================

        showAvatar(AVATAR_BASE64);

    }
    catch(error){
        console.error("❌ COMPRESS AVATAR ERROR:", error);
        alert(error.message || "Không thể xử lý avatar.");
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
    try{

        //==================================================
        // AVATAR HIỆN TẠI
        //==================================================

        let avatarUrl = PROFILE.avatar || "";
        const oldPublicId = PROFILE.avatar_public_id ||AVATAR_PUBLIC_ID || "";

        //==================================================
        // CÓ AVATAR MỚI
        //==================================================

        if(AVATAR_BASE64){
            const response = await fetch(AVATAR_BASE64);
            const blob = await response.blob();
            const file =
                new File(
                    [blob],
                    "avatar.jpg",
                    {
                        type:"image/jpeg"
                    }
                );

            //================================================
            // UPLOAD CLOUDINARY
            //================================================

            const media = await uploadToCloudinary(file,`hienluong/customers/avatar/${CUSTOMER_UID}`);
            avatarUrl = media.secure_url;
            AVATAR_PUBLIC_ID = media.public_id;

            //================================================
            // XÓA AVATAR CŨ
            //================================================

            if(oldPublicId){

                const user = auth.currentUser;
                if(!user){
                    throw new Error("Phiên đăng nhập Firebase đã hết.");
                }
                const token = await user.getIdToken(true);
                const deleteResponse =
                    await fetch(
                        "https://hienluong-auth-test.jonemac1975.workers.dev/cloudinary/delete",
                        {
                            method:"POST",
                            headers:{
                                "Content-Type":
                                    "application/json",
                                "Authorization":
                                    "Bearer " + token
                           },
                            body:JSON.stringify({
                                public_id:oldPublicId
                            })
                        }
                    );

                const deleteData = await deleteResponse.json();

                if(
                    !deleteResponse.ok ||
                    !deleteData.success
                ){

                    console.warn("⚠️ Không xóa được avatar cũ:",deleteData);
                }
                else{
                }
            }
        }

        //==================================================
        // DATA
        //==================================================

        const data = {
            username:PROFILE.username || "",
            created_at:PROFILE.created_at ||Date.now(),
            fullname,
            gender,
            address,
            nationality,
            phone,
            gmail,
            zalo,
            facebook,
            gioithieu,
            avatar:avatarUrl,
            avatar_public_id:AVATAR_PUBLIC_ID || oldPublicId,

            // Giữ nguyên trạng thái xét duyệt

		status: PROFILE.status ||"pending",
            updated_at:Date.now()
        };

        //==================================================
        // LƯU FIREBASE
        //==================================================

        const success = await writeData(`customers/${CUSTOMER_UID}/profile`,data);
        if(!success){
            throw new Error("Firebase không lưu được hồ sơ.");
        }
        PROFILE = data;

        //==================================================
        // LOCAL STORAGE
        //==================================================

        localStorage.setItem("customer_avatar",data.avatar || "");
        localStorage.setItem("customer_username",data.username || "");

        //==================================================
        // RESET ẢNH MỚI
        //==================================================

        AVATAR_BASE64 = "";
        AVATAR_PUBLIC_ID = data.avatar_public_id || "";
        alert("Lưu hồ sơ thành công!");
    }
    catch(err){
        console.error("❌ SAVE PROFILE ERROR:",err);
        alert("Không thể lưu hồ sơ: " +(err.message || err));
    }
}