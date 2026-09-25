//======================================================
// HIENLUONG WEBSITE
// File : /customers/js/chuyenhangngay.js
//======================================================

import {readData,writeData} from "../../scripts/firebaseService.js";
import {createEditor,getHtml,setHtml}from "../../js/editor.js";
import {compressImage} from "../../scripts/compressImage.js";
import {uploadToCloudinary} from "../../scripts/cloudinaryUpload.js";
import{getAuth}from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import{app}from "../../scripts/firebaseConfig.js";

const auth=getAuth(app);

//======================================================
// DATA
//======================================================

let LIST = [];
let CURRENT = null;
let CUSTOMER_UID = null;
let IMAGE_BASE64 = "";
let IMAGE_PUBLIC_ID = "";

//======================================================
// INIT
//======================================================

export async function init(){
    CUSTOMER_UID = localStorage.getItem("customer_uid");
        if(!CUSTOMER_UID){
        console.warn("⚠️ Không tìm thấy customer_uid");
        return;
    }

    // Khởi tạo editor
    createEditor("chn-editor");
    await loadData();
    CURRENT = null;
    renderForm();
    uploadImage();
    renderList();
    bindEvents();
}

//======================================================
// LOAD DATA
//======================================================

async function loadData(){

    LIST = [];
    CURRENT = null;
    try{

        const result = await readData(`customers/${CUSTOMER_UID}/chuyenhangngay`);
        if(!result){
        return;
        }

        LIST = Object.entries(result).map(([id,item]) => ({id,...item}));
        sortData();
        CURRENT = LIST[0] || null;
            }
    catch(err){
        console.error("❌ LOAD CHUYỆN HÀNG NGÀY ERROR:",err);
        LIST = [];
        CURRENT = null;
    }
}

//======================================================
// SORT DATA
//======================================================

function sortData(){
    LIST.sort((a,b)=>{
        // Ưu tiên ngày mới nhất

        const ad = a.date ? new Date(a.date).getTime(): 0;
        const bd = b.date ? new Date(b.date).getTime(): 0;
        if(bd !== ad){
            return bd - ad;
        }

        // Nếu cùng ngày
        // lấy bài cập nhật mới nhất

        return (
            Number(b.updated_at) || 0
        ) - (
            Number(a.updated_at) || 0
        );
    });
}


//======================================================
// RENDER FORM
//======================================================

function renderForm(){

    const title = document.getElementById("chn-title");
    const clip = document.getElementById("chn-clip");
    const date = document.getElementById("chn-date");
    const preview = document.getElementById("chn-image-preview");
    const imageInput = document.getElementById("chn-image");
    if(!title){
        return;
    }

    //==================================================
    // FORM TRẮNG - BÀI MỚI
    //==================================================

    if(!CURRENT){

        title.value = "";
        clip.value = "";
        date.value = "";
        setHtml("chn-editor",""
        );
        IMAGE_BASE64 = "";
        IMAGE_PUBLIC_ID = "";
        if(preview){
            preview.innerHTML = "";
        }

        if(imageInput){
            imageInput.value = "";
        }

        return;
    }

    //==================================================
    // SỬA BÀI
    //==================================================

    title.value = CURRENT.title || "";
    clip.value = CURRENT.clip || "";
    date.value = CURRENT.date || "";
    setHtml("chn-editor",CURRENT.content || ""
    );

    //==================================================
    // ẢNH CŨ
    //==================================================

    IMAGE_BASE64 = "";
    IMAGE_PUBLIC_ID = CURRENT.image_public_id || "";
    if(
        preview &&
        CURRENT.image
    ){

        preview.innerHTML =
            `<img
                src="${CURRENT.image}"
                alt="Ảnh minh họa">`;

    }
    else if(preview){

        preview.innerHTML = "";
    }

    if(imageInput){
        imageInput.value = "";
    }
}


//======================================================
// UPLOAD IMAGE
//======================================================

async function uploadImage(){

    const input = document.getElementById("chn-image");
    const preview = document.getElementById("chn-image-preview");
    if(!input){
        return;
    }
    input.onchange = async function(){

        const file = this.files?.[0];
        if(!file){
            return;
        }

        //================================================
        // KIỂM TRA FILE
        //================================================

        if(!file.type.startsWith("image/")){
            alert("Vui lòng chọn file hình ảnh!");
            input.value = "";
            return;
        }

        //================================================
        // NÉN ẢNH
        //================================================

        try{
            const base64 = await compressImage(file,"image");

            //================================================
            // LƯU ẢNH MỚI TẠM THỜI
            //================================================

            IMAGE_BASE64 = base64;

            // Ảnh mới chưa có public_id

            IMAGE_PUBLIC_ID = "";

            //================================================
            // PREVIEW
            //================================================

            if(preview){

                preview.innerHTML =
                    `<img
                        src="${base64}"
                        alt="Ảnh minh họa">`;

            }
        }
        catch(error){
            console.error("❌ COMPRESS IMAGE ERROR:",error);
            alert(error.message ||"Không thể xử lý hình ảnh!");
            input.value = "";
        }
    };
}

//======================================================
// RENDER LIST
//======================================================

function renderList(){
    const tbody = document.getElementById("chn-list");
    if(!tbody){
        return;
    }

    //==================================================
    // KHÔNG CÓ DỮ LIỆU
    //==================================================

    if(LIST.length === 0){
        tbody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="chn-empty">
                    Chưa có chuyện nào.
                </td>
            </tr>
        `;

        return;
    }

    //==================================================
    // DANH SÁCH
    //==================================================

    tbody.innerHTML = "";
    LIST.forEach((item,index)=>{
        const tr = document.createElement("tr");
        tr.dataset.id = item.id;
        tr.innerHTML =`

            <td>
                ${index + 1}
            </td>

            <td>
                ${item.date || ""}
            </td>

            <td
                class="chn-list-title"
                title="${item.title || ""}">
                ${item.title || ""}
            </td>

            	<td
    		class="chn-list-content"
   		title="${getContentText(item.content)}">
   		${getContentText(item.content)}
		</td>

            <td>

                ${
                    item.image
                    ? `
                        <img
                            src="${item.image}"
                            class="chn-list-image"
                            alt="Ảnh">
                    `
                    : ""
                }

            </td>

            <td>

                ${
                    item.clip
                    ? `
                        <a
                            href="${item.clip}"
                            target="_blank"
                            rel="noopener">
                            🎬 Xem
                        </a>
                    `
                    : ""
                }

            </td>

            <td>

                <button
                    type="button"
                    class="chn-btn-edit"
                    data-id="${item.id}">
                    Sửa
                </button>

                <button
                    type="button"
                    class="chn-btn-delete"
                    data-id="${item.id}">
                    🗑 Xóa
                </button>

            </td>

        `;

        tbody.appendChild(tr);

    });

    bindListActions();

}


//======================================================
// LẤY TEXT TỪ CONTENT
//======================================================

function getContentText(html){

    if(!html){
        return "";
    }

    const div = document.createElement("div");
    div.innerHTML = html;
    return (
        div.textContent ||
        div.innerText ||
        ""
    ).trim();

}


//======================================================
// BIND EVENTS
//======================================================

function bindEvents(){
    const save = document.getElementById("btn-chn-save");
    const cancel = document.getElementById("btn-chn-cancel");
    if(save){
        save.onclick = saveData;
    }

    if(cancel){
        cancel.onclick = clearForm;

    }

}


//======================================================
// BIND LIST ACTIONS
//======================================================

function bindListActions(){

    document
    .querySelectorAll(".chn-btn-edit")
    .forEach(btn=>{

        btn.onclick = function(){
        const id = this.dataset.id;
        const item = LIST.find(x => x.id === id);
            if(!item){
                return;
            }

            CURRENT = item;
            renderForm();
            window.scrollTo({
                top:0,
                behavior:"smooth"
            });
        };
    });


    document
    .querySelectorAll(".chn-btn-delete")
    .forEach(btn=>{
        btn.onclick = async function(){
            const id = this.dataset.id;
            const item = LIST.find(x => x.id === id);
            if(!item){
                return;
            }
            const ok = confirm(`Xóa chuyện "${item.title || ""}"?`);
            if(!ok){
                return;
            }
            await deleteData(id);
        };
    });
}


//======================================================
// SAVE DATA
//======================================================

async function saveData(){

    if(!CUSTOMER_UID){
        alert("Không xác định được thành viên.");
        return;
    }

    const title = document.getElementById("chn-title")?.value.trim();
    const content = getHtml("chn-editor");
    const clip = document.getElementById("chn-clip")?.value.trim();
    const date = document.getElementById("chn-date")?.value;

    //==================================================
    // KIỂM TRA
    //==================================================

    if(!title){
        alert("Vui lòng nhập tiêu đề.");
        return;
    }

    if(!content){
        alert("Vui lòng nhập nội dung.");
        return;
    }

    if(!date){
        alert("Vui lòng chọn ngày.");
        return;
    }

    //==================================================
    // ID
    //==================================================

    const id = CURRENT?.id ||`chn${Date.now()}`;
    const time = Date.now();
    try{

        //================================================
        // ẢNH HIỆN TẠI
        //================================================

        let imageUrl = CURRENT?.image || "";
        const oldPublicId = CURRENT?.image_public_id || IMAGE_PUBLIC_ID || "";

        //================================================
        // CÓ ẢNH MỚI
        //================================================

        if(IMAGE_BASE64){
            const response = await fetch(IMAGE_BASE64);
            const blob = await response.blob();
            const file =
                new File(
                    [blob],
                    "chuyenhangngay.jpg",
                    {
                        type:"image/jpeg"
                    }
                );

            //================================================
            // UPLOAD CLOUDINARY
            //================================================

            const media = await uploadToCloudinary(file,`hienluong/customers/chuyenhangngay/${CUSTOMER_UID}`);
            imageUrl = media.secure_url;
            IMAGE_PUBLIC_ID = media.public_id;

            //================================================
            // XÓA ẢNH CŨ
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
                                public_id:
                                    oldPublicId
                            })
                        }
                    );

                const deleteData = await deleteResponse.json();
                if(
                    !deleteResponse.ok ||
                    !deleteData.success
                ){

                    console.warn("⚠️ Không xóa được ảnh cũ:",deleteData);
                }
                else{
                }
            }
        }

        //================================================
        // DATA
        //================================================

        const data = {
            title,
            image:imageUrl,
            image_public_id:IMAGE_PUBLIC_ID || oldPublicId,
            content,
            clip,
            date,
            updated_at: time
        };

        //================================================
        // LƯU FIREBASE
        //================================================

        const success = await writeData(`customers/${CUSTOMER_UID}/chuyenhangngay/${id}`,data);
        if(!success){
            throw new Error("Firebase không lưu được dữ liệu.");
        }
        alert("Đã lưu thành công!");

        //================================================
        // RESET
        //================================================

        IMAGE_BASE64 = "";
        IMAGE_PUBLIC_ID = data.image_public_id || "";

        //================================================
        // LOAD LẠI
        //================================================

        await loadData();

        // Sau khi lưu → form mới

        CURRENT = null;
        renderForm();
        renderList();
    }
    catch(err){
        console.error("❌ SAVE ERROR:",err);
        alert("Không thể lưu dữ liệu: " + (err.message || err));
    }
}


//======================================================
// DELETE DATA
//======================================================

async function deleteData(id){
    try{

        //================================================
        // TÌM BÀI
        //================================================

        const item = LIST.find(x => x.id === id);
        if(!item){
            return;
        }

        //================================================
        // PUBLIC ID ẢNH
        //================================================

        const publicId = item.image_public_id || "";

        //================================================
        // XÓA CLOUDINARY
        //================================================

        if(publicId){

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
                            public_id:
                                publicId
                        })
                    }
                );

            const deleteData = await deleteResponse.json();

            if(
                !deleteResponse.ok ||
                !deleteData.success
            ){

                console.warn("⚠️ Không xóa được ảnh Cloudinary:",deleteData);

                // Không xóa Firebase nếu ảnh Cloudinary
                // chưa được xử lý thành công

                return;
            }
        }

        //================================================
        // XÓA FIREBASE
        //================================================

        const success = await writeData(`customers/${CUSTOMER_UID}/chuyenhangngay/${id}`,null);
        if(!success){
            throw new Error("Firebase không xóa được dữ liệu.");
        }

        //================================================
        // LOAD LẠI
        //================================================

        await loadData();
        CURRENT = LIST[0] || null;
        renderForm();
        renderList();
    }
    catch(err){
        console.error("❌ DELETE ERROR:",err);
        alert("Không thể xóa dữ liệu: " +(err.message || err));
    }
}


//======================================================
// CLEAR FORM
//======================================================

function clearForm(){

    CURRENT = null;
    renderForm();

}