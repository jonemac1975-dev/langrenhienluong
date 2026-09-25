//======================================================
// HIENLUONG WEBSITE
// File : customers/js/baiviet.js
// Module : Bài viết
//======================================================

import {readData,writeData} from "../../scripts/firebaseService.js";
import {createEditor,getHtml,setHtml}from "../../js/editor.js";
import {compressImage}from "../../scripts/compressImage.js";
import {uploadToCloudinary}from "../../scripts/cloudinaryUpload.js";
import{getAuth}from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import{app}from "../../scripts/firebaseConfig.js";

const auth=getAuth(app);

//======================================================
// BIẾN
//======================================================

let CUSTOMER_UID = null;
let CURRENT = null;
let LIST = [];
let imageBase64 = "";
let imagePublicId = "";


//======================================================
// INIT
//======================================================

document.addEventListener("DOMContentLoaded",init);


//======================================================
// INIT MODULE
//======================================================

export async function init(){
    CUSTOMER_UID = localStorage.getItem("customer_uid");
    if(!CUSTOMER_UID){
        console.warn("⚠️ Không tìm thấy customer_uid");
        return;
    }


    // Editor dùng chung

    createEditor("bv-editor");
    await loadData();
    sortData();

    // Form đăng bài
    renderCreate();
    renderPost();
    bindEvents();

document
.getElementById("bv-btn-post")
?.addEventListener(
    "click",
    () => {
        if(CURRENT){
            updatePost();
        }
        else{
            saveData();
        }
    }
);
}


//======================================================
// LOAD DATA
//======================================================

async function loadData(){
    try{
        const data = await readData(`customers/${CUSTOMER_UID}/baiviet`);
        if(!data){
            LIST = [];
            return;
        }


        //================================================
        // FIREBASE OBJECT → ARRAY
        //================================================

        LIST =
            Object.entries(data)
            .map(
                ([id,item]) => {
                    return {
                        id,
                        ...(item || {})
                    };
                }
            );


    }
    catch(err){
        console.error("❌ Không load được bài viết:", err);
        LIST = [];
    }
}


//======================================================
// SORT DATA
//======================================================

function sortData(){

    LIST.sort(
        (a,b) => {

            const timeA =
                Number(
                    a.updated_at ||
                    a.created_at ||
                    0
                );

            const timeB =
                Number(
                    b.updated_at ||
                    b.created_at ||
                    0
                );

            return timeB - timeA;

        }
    );

}

//======================================================
// RENDER CREATE
//======================================================

function renderCreate(){
    const avatar = document.getElementById("bv-avatar");
    const username = document.getElementById("bv-username");

    //==================================================
    // AVATAR
    //==================================================

    const savedAvatar = localStorage.getItem("customer_avatar");
    if(avatar){
        if(savedAvatar){
            avatar.src = savedAvatar;
        }
        else{
            // Avatar mặc định
            avatar.src =
                "../../images/avatar-default.png";
        }
    }


    //==================================================
    // USERNAME
    //==================================================

    const savedUsername = localStorage.getItem("customer_username");

    if(username){
        username.textContent = savedUsername || "Thành viên";
    }
}


//======================================================
// LOAD IMAGE
//======================================================

async function loadImage(event){

    const file = event?.target?.files?.[0];
    if(!file) return;
    if(!file.type.startsWith("image/")){
        alert("Vui lòng chọn file ảnh");
        return;
    }
    try{
        imageBase64 = await compressImage(file,"image");

        // Có ảnh mới => bỏ public_id cũ
        imagePublicId = "";

        const preview = document.getElementById("bv-image-preview");
if(preview){
    preview.innerHTML = `
        <img
            src="${imageBase64}"
            alt="Ảnh xem trước"
            style="
                max-width:100%;
                max-height:300px;
                display:block;
                margin:auto;
                border-radius:10px;
            "
        >
    `;

    preview.style.display = "block";
}
    }
    catch(err){
        console.error("❌ IMAGE COMPRESS ERROR:",err);
        alert("Không thể xử lý ảnh");
    }
}


//======================================================
// BIND EVENTS
//======================================================

function bindEvents(){

    //==================================================
    // CHỌN ẢNH
    //==================================================
    document.getElementById("bv-image-file")?.addEventListener("change", loadImage);
    //==================================================
    // NÚT CLIP
    //==================================================
    document.getElementById("bv-btn-clip")?.addEventListener("click",function(){
            const box = document.querySelector(".baiviet-clip-input");
            if(!box){
                return;
            }

            box.classList.toggle(
                "active"
            );

            if(
                box.classList.contains(
                    "active"
                )
            ){

                document.getElementById("bv-clip")?.focus();
            }
        }
    );


    //==================================================
    // NÚT XÓA FORM
    //==================================================

    document.getElementById("bv-btn-clear")?.addEventListener("click",clearCreateForm);
}


function clearCreateForm(){

const caption = document.getElementById("bv-caption");
if(caption){ caption.value = "";
}
    setHtml("bv-editor","");
    imageBase64 = "";
    imagePublicId = "";
    const image = document.getElementById("bv-image-file");
    if(image){image.value = "";
    }
    const preview =document.getElementById("bv-image-preview");
    if(preview){
        preview.innerHTML = "";
        preview.classList.remove(
            "active"
        );
    }

    const clip =document.getElementById("bv-clip");
    if(clip){
        clip.value = "";
    }

    const clipBox = document.querySelector(".baiviet-clip-input");
    if(clipBox){
        clipBox.classList.remove(
            "active"
        );
    }

    CURRENT = null;
    }


async function saveData(){

    const caption = document.getElementById("bv-caption")?.value.trim();
    const content = getHtml("bv-editor") || "";
    const clip = document.getElementById("bv-clip")?.value.trim();
    if(!caption && !content && !imageBase64 && !clip){
        alert("Vui lòng nhập nội dung bài viết");
        return;
    }
    try{
        const time = Date.now();
        let imageUrl = "";
        let imagePublicId = "";

        //==================================================
        // UPLOAD ẢNH LÊN CLOUDINARY
        //==================================================

        if(imageBase64){
            const response = await fetch(imageBase64);
            const blob = await response.blob();
            const file = new File([blob],`baiviet-${time}.jpg`,{type: blob.type || "image/jpeg"});
            const media = await uploadToCloudinary(file,`hienluong/customers/baiviet/${CUSTOMER_UID}`);
            imageUrl = media.secure_url || "";
            imagePublicId = media.public_id || "";
        }

        //==================================================
        // DATA
        //==================================================

        const id = "bv" + time;
        const data = {
            caption:caption || "",
            content:content || "",
            image:imageUrl,
            image_public_id:imagePublicId,
            clip:clip || "",
            created_at:time,
            updated_at:time
        };

        //==================================================
        // SAVE FIREBASE
        //==================================================

        const success = await writeData(`customers/${CUSTOMER_UID}/baiviet/${id}`,data);
        if(!success){
            alert("Lưu bài viết thất bại");
            return;
        }

        //==================================================
        // CẬP NHẬT LIST
        //==================================================

        LIST.unshift({
            id,
            ...data
        });

        //==================================================
        // RESET
        //==================================================

        clearCreateForm();
        renderPost();
    }
    catch(err){
        console.error("❌ SAVE BÀI VIẾT ERROR:",err);
        alert("Không thể lưu bài viết");
    }
}


function renderPost(){
    const box = document.getElementById("bv-list");
    if(!box){
        return;
    }

    if(!LIST.length){
        box.innerHTML = `<div class="baiviet-empty"> Chưa có bài viết. </div>`;
        return;
    }
    const avatar =localStorage.getItem("customer_avatar") ||"../../images/avatar-default.png";
    const username = localStorage.getItem("customer_username") ||"Thành viên";

    box.innerHTML = LIST.map(item => {
	const date = formatDate( item.created_at);
                return `
                <article
                    class="baiviet-card"
                    data-id="${item.id}">
                    <!-- HEADER -->
                    <div class="baiviet-card-header">
    <div class="baiviet-card-avatar">
        <img
            src="${avatar}"
            alt="Avatar">
    </div>
    <div class="baiviet-card-user">
        <strong>
            ${escapeHtml(username)}
        </strong>
        <span class="baiviet-card-date">
            ${date}
        </span>
    </div>

    <button
        type="button"
        class="baiviet-more"
        title="Tùy chọn">
        ⋯
    </button>
</div>

                    <!-- CAPTION -->

${
    item.caption
    ? `
    <div
        class="baiviet-card-caption">
        ${escapeHtml(item.caption)}
    </div>
    `
    : ""
}


<!-- CONTENT -->

${
    item.content
    ? `
    <div
        class="baiviet-card-content">
        ${item.content}
    </div>
   `
    : ""
}

                    <!-- IMAGE -->
                    ${
                        item.image
                        ? `
                        <div
                            class="baiviet-card-image">
                            <img
                                src="${item.image}"
                                alt="Ảnh bài viết">
                        </div>
                        `
                        : ""
                    }

                    <!-- CLIP -->
                    ${
                        item.clip
                        ? `
                        <div
                            class="baiviet-card-clip">
                            <a
                                href="${item.clip}"
                                target="_blank"
                                rel="noopener">
                                🎬 Xem Video
                            </a>
                        </div>
                        `
                        : ""
                    }
<div class="baiviet-social-actions">
    <button
        type="button"
        class="bv-like"
        data-id="${item.id}">
        ❤️ Like
    </button>
    <button
        type="button"
        class="bv-comment"
        data-id="${item.id}">
        💬 Comment
    </button>
    <button
        type="button"
        class="bv-share"
        data-id="${item.id}">
        ↗ Share
    </button>
</div>
                    <!-- ACTION -->
                    <div
                        class="baiviet-card-actions">
                        <button
                            type="button"
                            class="bv-edit"
                            data-id="${item.id}">
                            ✏️ Sửa
                        </button>
                        <button
                            type="button"
                            class="bv-delete"
                            data-id="${item.id}">
                            🗑️ Xóa
                        </button>
                    </div>
                </article>
                `;
            }
        )
        .join("");
    bindPostEvents();
}


function bindPostEvents(){
    document.querySelectorAll(".bv-edit").forEach( btn => {
            btn.onclick =() => {
            editPost(btn.dataset.id
                    );
                };
        }
    );

    document.querySelectorAll(".bv-delete").forEach(
        btn => {
            btn.onclick =
                () => {
                    deletePost(
                        btn.dataset.id
                    );
                };
        }
    );
}


//======================================================
// EDIT POST
//======================================================

function editPost(id){

    const item = LIST.find(x => x.id === id);
    if(!item) return;
    CURRENT = item;
    const caption = document.getElementById("bv-caption");
    if(caption){
        caption.value =
            item.caption || "";
    }

    setHtml("bv-editor",item.content || "");
    const clip = document.getElementById("bv-clip");
    if(clip){
        clip.value =
            item.clip || "";
    }

    // Không đưa URL Cloudinary cũ vào imageBase64

     imageBase64 = "";

    // Giữ public_id cũ để dùng khi cập nhật

     imagePublicId = item.image_public_id || "";
     const preview = document.getElementById("bv-image-preview");

    if(preview){
        if(item.image){
            preview.src = item.image;
            preview.style.display = "block";
        }
        else{
            preview.src = "";
            preview.style.display = "none";
        }
    }
    const btn = document.getElementById("bv-btn-post");
    if(btn){
        btn.textContent = "💾 Cập nhật bài viết";
    }
}

async function updatePost(){

    if(!CURRENT){
        return;
    }
    const caption = document.getElementById("bv-caption")?.value.trim();
    const content = getHtml("bv-editor") || "";
    const clip = document.getElementById("bv-clip")?.value.trim();
    try{

        //==================================================
        // GIỮ ẢNH CŨ NẾU KHÔNG CHỌN ẢNH MỚI
        //==================================================

        let imageUrl = CURRENT.image || "";
        let newImagePublicId = CURRENT.image_public_id || "";
        const oldImagePublicId = CURRENT.image_public_id || "";

        //==================================================
        // NẾU CÓ ẢNH MỚI → UPLOAD CLOUDINARY
        //==================================================

        if(imageBase64){

            const response = await fetch(imageBase64);
            const blob = await response.blob();
            const file =
                new File(
                    [blob],
                    `baiviet-${Date.now()}.jpg`,
                    {
                        type:
                            blob.type || "image/jpeg"
                    }
                );

            const media = await uploadToCloudinary(file,`hienluong/customers/baiviet/${CUSTOMER_UID}`);
            imageUrl = media.secure_url || "";
            newImagePublicId = media.public_id || "";

            //================================================
            // XÓA ẢNH CŨ TRÊN CLOUDINARY
            //================================================

            if(
                oldImagePublicId &&
                newImagePublicId
            ){

                const user = auth.currentUser;
                if(!user){
                    alert("Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.");
                    return;
                }

                const token = await user.getIdToken(true);
                const responseDelete =
                    await fetch(
                        "https://hienluong-auth-test.jonemac1975.workers.dev/cloudinary/delete",
                        {
                            method:"POST",
                            headers:{
                                "Content-Type":
                                    "application/json",
                                "Authorization":
                                    `Bearer ${token}`
                            },
                            body:
                                JSON.stringify({
                                    public_id:
                                        oldImagePublicId
                                })
                        }
                    );

                const deleteResult = await responseDelete.json();

                if(
                    !responseDelete.ok ||
                    !deleteResult.success
                ){

                    console.error("❌ XÓA ẢNH CŨ THẤT BẠI:",deleteResult);
                    alert("Không thể xóa ảnh cũ trên Cloudinary. Bài viết chưa được cập nhật.");
                    return;
                }
            }
        }

        //==================================================
        // DATA MỚI
        //==================================================

        const data = {
            caption:caption || "",
            content:content || "",
            image:imageUrl,
            image_public_id:newImagePublicId,
            clip:clip || "",
            created_at:CURRENT.created_at || Date.now(),
            updated_at:Date.now()
        };

        //==================================================
        // SAVE FIREBASE
        //==================================================

        const success = await writeData(`customers/${CUSTOMER_UID}/baiviet/${CURRENT.id}`,data);
        if(!success){
            alert("Lưu bài viết thất bại");
            return;
        }

        //==================================================
        // UPDATE LIST
        //==================================================

        const index = LIST.findIndex(x => x.id === CURRENT.id);
        if(index !== -1){
            LIST[index] = {id: CURRENT.id,...data};
        }

        //==================================================
        // RESET
        //==================================================

        clearCreateForm();
        renderPost();
    }
    catch(err){
        console.error("❌ UPDATE BÀI VIẾT ERROR:",err);
        alert("Không thể cập nhật bài viết");
    }
}


//======================================================
// DELETE POST
//======================================================

async function deletePost(id){

    const item = LIST.find(x => x.id === id);
    if(!item){
        return;
    }

    if(!confirm("Bạn có chắc muốn xóa bài viết này?")){
        return;
    }

    try{

        //==================================================
        // XÓA ẢNH CLOUDINARY TRƯỚC
        //==================================================

        if(item.image_public_id){

            const user = auth.currentUser;
            if(!user){
                alert("Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.");
                return;
            }
            const token = await user.getIdToken(true);
            const response =
                await fetch(
                    "https://hienluong-auth-test.jonemac1975.workers.dev/cloudinary/delete",
                    {
                        method:"POST",
                        headers:{
                            "Content-Type":
                                "application/json",
                            "Authorization":
                                `Bearer ${token}`
                        },
                        body:
                            JSON.stringify({
                                public_id:
                                    item.image_public_id
                            })
                    }
                );

            const result = await response.json();
            if(
                !response.ok ||
                !result.success
            ){

                console.error("❌ XÓA ẢNH CLOUDINARY THẤT BẠI:",result);
                alert("Không thể xóa ảnh. Bài viết chưa bị xóa.");
                return;
            }
        }

        //==================================================
        // XÓA FIREBASE
        //==================================================

        const success = await writeData(`customers/${CUSTOMER_UID}/baiviet/${id}`,null);
        if(!success){
            alert("Xóa bài viết trên Firebase thất bại");
            return;
        }

        //==================================================
        // UPDATE LIST
        //==================================================

        LIST = LIST.filter(x => x.id !== id);
        if(CURRENT?.id === id){
            CURRENT = null;
        }

        renderPost();
    }
    catch(err){
        console.error("❌ DELETE BÀI VIẾT ERROR:",err);
        alert("Không thể xóa bài viết");
    }
}


//======================================================
// FORMAT DATE
//======================================================

function formatDate(timestamp){
    if(!timestamp){
        return "";
    }
    const date = new Date( Number(timestamp));
    if(
        Number.isNaN(
            date.getTime()
        )
    ){
        return "";
    }

    return date.toLocaleDateString(
        "vi-VN",
        {
            day:"2-digit",
            month:"2-digit",
            year:"numeric"
        }
    );

}


//======================================================
// ESCAPE HTML
//======================================================

function escapeHtml(value){
    return String(value || "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}