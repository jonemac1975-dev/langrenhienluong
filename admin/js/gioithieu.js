//======================================================
// HIENLUONG WEBSITE
// File : admin/js/gioithieu.js
//======================================================

import { readData, writeData } from "../../scripts/firebaseService.js";
import { createEditor, getHtml, setHtml } from "../../js/editor.js";

let imageBase64 = "";
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
        if(data.image){
            imageBase64 = data.image;
            const img = document.getElementById("gt-preview");
            img.src = imageBase64;
            img.style.display = "block";
        }
    }
    catch(err){
        console.error(err);
        alert("Không đọc được dữ liệu.");
    }
}

//======================================================

function loadImage(e){

    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
        imageBase64 = reader.result;
        const img = document.getElementById("gt-preview");
        img.src = imageBase64;
        img.style.display = "block";
    };
    reader.readAsDataURL(file);
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
        await writeData("admin/gioithieu",{title: title,content: content,image: imageBase64,video: video,updated_at: Date.now()});
        alert("Đã lưu thành công.");
    }
    catch(err){
        console.error(err);
        alert("Lưu thất bại.");
    }
}