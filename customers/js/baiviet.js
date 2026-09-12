//======================================================
// HIENLUONG WEBSITE
// File : customers/js/baiviet.js
// Module : Bài viết
//======================================================

import {readData,writeData} from "../../scripts/firebaseService.js";
import {createEditor,getHtml,setHtml} from "../../js/editor.js";


//======================================================
// BIẾN
//======================================================

let CUSTOMER_UID = null;
let CURRENT = null;
let LIST = [];
let imageBase64 = "";


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

function loadImage(e){
    const file =  e.target.files?.[0];
    if(!file){
        return;
    }


    //==================================================
    // KIỂM TRA FILE
    //==================================================

    if(
        !file.type.startsWith("image/")){alert("Vui lòng chọn file hình ảnh!");
        e.target.value = "";
        return;
    }


    //==================================================
    // ĐỌC BASE64
    //==================================================

    const reader = new FileReader();
    reader.onload = function(){
        imageBase64 = reader.result;
        const preview = document.getElementById("bv-image-preview");
        if(preview){
            preview.innerHTML = `<img src="${imageBase64}" alt="Ảnh bài viết">`;
            preview.classList.add("active");
        }
    };

    reader.onerror = function(){
        console.error("❌ Không đọc được ảnh." );
        alert("Không thể đọc hình ảnh!");
    };
    reader.readAsDataURL(file);
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
    if(!CUSTOMER_UID){
        alert("Không xác định được tài khoản.");
        return;
    }

    const caption = document.getElementById("bv-caption")?.value.trim() || "";
    const content = getHtml("bv-editor");
    const clip = document.getElementById("bv-clip")?.value.trim() || "";
    //==================================================
    // KIỂM TRA NỘI DUNG
    //==================================================
    const temp = document.createElement("div");
    temp.innerHTML = content || "";
    const text = temp.textContent.replace(/\s+/g," ").trim();
    if(!caption && !text && !imageBase64 && !clip){alert("Hãy nhập caption, nội dung, chọn ảnh hoặc thêm clip.");
    return;
}

    //==================================================
    // ID BÀI VIẾT
    //==================================================
    const id = "bv" + Date.now();
    const time = Date.now();
    //==================================================
    // DATA
    //==================================================
    const data = {caption: caption || "",content:content || "",image:imageBase64 || "",clip: clip || "", created_at: time, updated_at: time};
    try{
        await writeData(`customers/${CUSTOMER_UID}/baiviet/${id}`, data);
        //================================================
        // CẬP NHẬT LIST
        //================================================
        LIST.push({
            id,
            ...data
        });
        sortData();
        clearCreateForm();
        renderPost();
        alert("Đã đăng bài thành công.");
    }
    catch(err){ console.error("❌ Lưu bài viết thất bại:", err);
        alert("Lưu bài viết thất bại.");
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
    if(!item){
        alert("Không tìm thấy bài viết.");
        return;
    }
    CURRENT = item;

const caption = document.getElementById("bv-caption");
if(caption){caption.value = item.caption || "";
}
    setHtml("bv-editor",item.content || "");
    imageBase64 = item.image || "";
    const preview = document.getElementById( "bv-image-preview");
    if(preview){
        if(item.image){
            preview.innerHTML = `
                <img
                    src="${item.image}"
                    alt="Ảnh bài viết">
            `;
            preview.classList.add(
                "active"
            );
        }
        else{
            preview.innerHTML = "";
            preview.classList.remove(
                "active"
            );
        }
    }

    const clip = document.getElementById("bv-clip");
    const clipBox = document.querySelector(".baiviet-clip-input");
    if(clip){
        clip.value =item.clip || "";
    }

    if(clipBox){
        if(item.clip){
            clipBox.classList.add(
                "active"
            );
        }
        else{
            clipBox.classList.remove(
                "active"
            );
        }
    }


    //==================================================
    // ĐỔI NÚT ĐĂNG → CẬP NHẬT
    //==================================================
    const btn = document.getElementById("bv-btn-post");
    if(btn){btn.textContent =
            "CẬP NHẬT BÀI VIẾT";
    }

    //==================================================
    // SCROLL LÊN FORM
    //==================================================

    document.querySelector(".baiviet-create")?.scrollIntoView({behavior:"smooth",block:"start"});
}

async function updatePost(){
    if(!CURRENT){
        saveData();
        return;
    }
    const caption = document.getElementById("bv-caption")?.value.trim() || "";
    const content = getHtml("bv-editor");
    const clip = document.getElementById("bv-clip")?.value.trim() || "";
    const data = {caption: caption || "",content: content || "",image: imageBase64 || "",clip: clip || "", created_at: CURRENT.created_at || Date.now(),updated_at: Date.now()};
    try{
        await writeData(`customers/${CUSTOMER_UID}/baiviet/${CURRENT.id}`,data);
        const index = LIST.findIndex(x =>x.id === CURRENT.id);
        if(index !== -1){
            LIST[index] = {
                id:
                    CURRENT.id,
                ...data
            };
        }

        sortData();
        CURRENT = null;
        clearCreateForm();
        //================================================
        // TRẢ NÚT VỀ ĐĂNG BÀI
        //================================================
        const btn = document.getElementById("bv-btn-post");
        if(btn){
            btn.textContent = "ĐĂNG BÀI";
        }
        renderPost();
        alert(
            "Đã cập nhật bài viết."
        );
    }
    catch(err){
        console.error("❌ Cập nhật thất bại:",err);
        alert("Cập nhật bài viết thất bại.");
    }
}


//======================================================
// DELETE POST
//======================================================

async function deletePost(id){
    const item = LIST.find( x => x.id === id);
    if(!item){
        return;
    }

    const ok = confirm("Bạn có chắc muốn xóa bài viết này?");
    if(!ok){
        return;
    }
    try{
            await writeData(`customers/${CUSTOMER_UID}/baiviet/${id}`,null);
        LIST = LIST.filter(x => x.id !== id);
        if(
            CURRENT &&
            CURRENT.id === id
        ){
            CURRENT = null;
            clearCreateForm();
        }
        renderPost();
        alert("Đã xóa bài viết.");
    }
    catch(err){
        console.error("❌ Xóa bài viết thất bại:",err);
        alert("Xóa bài viết thất bại.");
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