//======================================================
// HIENLUONG WEBSITE
// File : admin/js/gioithieu.js
//======================================================

import {readData,writeData} from "../../scripts/firebaseService.js";
import {createEditor,getHtml,setHtml} from "../../js/editor.js";
import {compressImage} from "../../scripts/compressImage.js";
import {uploadToCloudinary} from "../../scripts/cloudinaryUpload.js";
import{getAuth}from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import{app}from "../../scripts/firebaseConfig.js";

const auth=getAuth(app);
let imageBase64="";
let imagePublicId="";


document.addEventListener("DOMContentLoaded", init);

//======================================================

export async function init(){
    createEditor("gt-editor");
    bindEvents();
    await loadData();
}

//======================================================

function bindEvents(){

    document.getElementById("gt-image-file")?.addEventListener("change",loadImage);
    document.getElementById("btn-save-gioithieu")?.addEventListener("click",saveData);
}

//======================================================

async function loadData(){

    try{
        const data = await readData("admin/gioithieu");
        if(!data) return;
        document.getElementById("gt-title").value = data.title || "";
        document.getElementById("gt-video").value = data.video || "";
        setHtml("gt-editor",data.content || "");

        // Lưu public_id ảnh Cloudinary cũ
        imagePublicId =
            data.image_public_id || "";

        // Ảnh cũ chỉ dùng để hiển thị
        // Không đưa vào imageBase64

        imageBase64 = "";
        if(data.image){
            const img = document.getElementById("gt-preview");
            img.src = data.image;
            img.style.display = "block";
        }

    }
    catch(err){
        console.error(err);
        alert("Không đọc được dữ liệu.");
    }
}

//======================================================

async function loadImage(e){

    const file = e.target.files[0];
    if(!file) return;
    try{
        const compressed = await compressImage(file,"image");
        imageBase64 = compressed;
        const img = document.getElementById("gt-preview");
        img.src = imageBase64;
        img.style.display = "block";

    }
    catch(err){
        console.error(err);
        alert("Không xử lý được ảnh.");
    }
}

//======================================================

async function saveData(){

    const title = document.getElementById("gt-title").value.trim();
    const video = document.getElementById("gt-video").value.trim();
    const content = getHtml("gt-editor");
    if(title === ""){
        alert("Nhập tiêu đề.");
        return;
    }
    try{

        //==================================================
        // ẢNH HIỆN TẠI
        //==================================================

        let imageUrl = "";
        let oldPublicId = imagePublicId;

        // Đọc dữ liệu cũ để giữ nguyên ảnh

        const oldData = await readData("admin/gioithieu");
        if(oldData){
            imageUrl = oldData.image || "";
            if(!oldPublicId){
                oldPublicId = oldData.image_public_id || "";
            }
        }

        //==================================================
        // CÓ CHỌN ẢNH MỚI
        //==================================================

        if(imageBase64){

            const response = await fetch(imageBase64);
            const blob = await response.blob();
            const file =
                new File(
                    [blob],
                    "gioithieu.jpg",
                    {type:"image/jpeg"}
                );
            const media = await uploadToCloudinary(file,"hienluong/admin/gioithieu");
            imageUrl = media.secure_url;
            imagePublicId = media.public_id;

            //==================================================
            // XÓA ẢNH CŨ SAU KHI UPLOAD ẢNH MỚI THÀNH CÔNG
            //==================================================

            if(oldPublicId){

                const user = auth.currentUser;
                if(!user){
                    throw new Error("Chưa đăng nhập Firebase."
                    );
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

                if(!deleteResponse.ok ||
                   !deleteData.success){

                    console.warn("⚠️ Không xóa được ảnh cũ:",deleteData);
                }
                else{
                }
            }
        }

        //==================================================
        // LƯU FIREBASE
        //==================================================

        const success =
            await writeData(
                "admin/gioithieu",
                {
                    title:title,
                    content:content,
                    image:imageUrl,
                    image_public_id:imagePublicId,
                    video:video,
                    updated_at:Date.now()
                }
            );

        if(!success){
            throw new Error(
                "Firebase không lưu được dữ liệu."
            );
        }

        alert("Đã lưu.");

        // Reset trạng thái ảnh mới

        imageBase64 = "";

        // Giữ public_id ảnh hiện tại
        // để lần sửa sau biết ảnh nào cần xóa

        if(imagePublicId){
        }
    }
    catch(err){
        console.error(err);
        alert("Lưu thất bại: " + (err.message || err)
        );
    }
}