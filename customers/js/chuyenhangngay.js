//======================================================
// HIENLUONG WEBSITE
// File : /customers/js/chuyenhangngay.js
//======================================================

import {readData,writeData} from "../../scripts/firebaseService.js";
import {createEditor,getHtml,setHtml} from "../../js/editor.js";
console.log("📝 CHUYỆN HÀNG NGÀY JS LOADED");

//======================================================
// DATA
//======================================================

let LIST = [];
let CURRENT = null;
let CUSTOMER_UID = null;

//======================================================
// INIT
//======================================================

export async function init(){

    console.log("🚀 CHUYỆN HÀNG NGÀY INIT");

    CUSTOMER_UID =
        localStorage.getItem("customer_uid");

    console.log(
        "🆔 CUSTOMER UID =",
        CUSTOMER_UID
    );

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
            console.log("📝 Chưa có chuyện hàng ngày."
            );
            return;
        }

        LIST = Object.entries(result).map(([id,item]) => ({id,...item}));
        sortData();
        CURRENT = LIST[0] || null;
        console.log("📝 CHUYỆN HÀNG NGÀY =", LIST);
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
    const clip =  document.getElementById("chn-clip");
    const date =  document.getElementById("chn-date");
    const content = document.getElementById("chn-content");
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
        setHtml("chn-editor","");
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
    setHtml("chn-editor",CURRENT.content || "");

    //==================================================
    // ẢNH
    //==================================================

    if(
        preview &&
        CURRENT.image
    ){
        preview.innerHTML = `<img src="${CURRENT.image}" alt="Ảnh minh họa">`;
    }
    else if(preview){
        preview.innerHTML = "";
    }
}


//======================================================
// UPLOAD IMAGE
//======================================================

function uploadImage(){
    const input = document.getElementById("chn-image");
    const preview = document.getElementById("chn-image-preview");
    if(!input){
        return;
    }
    input.onchange = function(){
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
        // ĐỌC BASE64
        //================================================

        const reader = new FileReader();
        reader.onload = function(e){
        const base64 = e.target.result;

            // Lưu tạm ảnh vào CURRENT
            // để Phần 3 saveData() sử dụng

            if(!CURRENT){CURRENT = {};
            }

            CURRENT.image = base64;

            //================================================
            // PREVIEW
            //================================================

            if(preview){
                preview.innerHTML = `<img src="${base64}"alt="Ảnh minh họa">`;
            }
        };
        reader.onerror = function(){

            console.error("❌ Không đọc được hình ảnh.");
            alert("Không thể đọc hình ảnh!");
        };
        reader.readAsDataURL(file);
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
                    ✏️ Sửa
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

    const div =
        document.createElement("div");

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

            const id =
                this.dataset.id;

            const item =
                LIST.find(
                    x => x.id === id
                );

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

            const id =
                this.dataset.id;

            const item =
                LIST.find(
                    x => x.id === id
                );

            if(!item){
                return;
            }

            const ok =
                confirm(
                    `Xóa chuyện "${item.title || ""}"?`
                );

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

    const id = CURRENT?.id || `chn${Date.now()}`;
    const time = Date.now();

    //==================================================
    // DATA
    //==================================================

    const data = {
        title,
        image:
            CURRENT?.image || "",
        content,
        clip,
        date,
        updated_at:
            time
    };
    try{
        await writeData(`customers/${CUSTOMER_UID}/chuyenhangngay/${id}`,data);
        console.log("✅ ĐÃ LƯU CHUYỆN HÀNG NGÀY",data);

        alert("Đã lưu thành công!");

        //================================================
        // LOAD LẠI
        //================================================
        await loadData();

// Sau khi lưu → chuyển về form mới
CURRENT = null;
renderForm();
renderList();
    }
    catch(err){
        console.error("❌ SAVE ERROR:", err);
        alert("Không thể lưu dữ liệu.");
    }
}


//======================================================
// DELETE DATA
//======================================================

async function deleteData(id){

    try{

        await writeData(
            `customers/${CUSTOMER_UID}/chuyenhangngay/${id}`,
            null
        );

        console.log(
            "🗑 ĐÃ XÓA:",
            id
        );

        await loadData();

        CURRENT =
            LIST[0] || null;

        renderForm();

        renderList();

    }
    catch(err){

        console.error(
            "❌ DELETE ERROR:",
            err
        );

        alert(
            "Không thể xóa dữ liệu."
        );

    }

}


//======================================================
// CLEAR FORM
//======================================================

function clearForm(){

    CURRENT = null;

    renderForm();

}