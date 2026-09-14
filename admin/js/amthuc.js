//======================================================
// HIENLUONG WEBSITE
// File : admin/js/amthuc.js
//======================================================

import {readData,writeData} from "../../scripts/firebaseService.js";
import {createEditor,getHtml,setHtml} from "../../js/editor.js";
import {compressImage} from "../../scripts/compressImage.js";

let DATA={};
let editId="";
let imageBase64="";

export async function init(){
    createEditor("at-editor");
    bindEvents();
    await loadData();
}

function bindEvents(){
    document.getElementById("at-image-file").onchange=loadImage;
    document.getElementById("btn-at-save").onclick=saveData;
}

async function loadData(){
    DATA=await readData("admin/amthuc")||{};
    renderTable();
}


function shortAddress(value){
    const address=String(value||"");
    if(address.length<=30){
        return address;
    }

    return address.substring(0,25)+"...";
}

function renderTable(){
    const body=document.getElementById("at-body");
    body.innerHTML="";
    let stt=1;
    Object.keys(DATA).sort().forEach(id=>{
        const r=DATA[id];
        const mapLink=
            r.map
            ?
            `<a href="${r.map}" target="_blank">🌍 Xem</a>`
            :
            "-";

        const videoLink=
            r.video
            ?
            `<a href="${r.video}" target="_blank">🎥 Xem</a>`
            :
            "-";
        body.innerHTML+=`
        <tr>
            <td>${stt++}</td>
            <td>${r.name||""}</td>
            <td>${shortAddress(r.address)}</td>
            <td>${mapLink}</td>
            <td>${videoLink}</td>
            <td>
                <button onclick="editAmThuc('${id}')">
                    Sửa
                </button>

                <button onclick="deleteAmThuc('${id}')">
                    Xóa
                </button>
            </td>
        </tr>
        `;
    });
}


async function loadImage(e){

    const file=e.target.files[0];

    if(!file)return;

    try{

        imageBase64=
            await compressImage(
                file,
                "image"
            );

        const img=
            document.getElementById(
                "at-preview"
            );

        img.src=imageBase64;
        img.style.display="block";

        console.log(
            "Ảnh ẩm thực sau nén:",
            imageBase64.length,
            "ký tự Base64"
        );

    }catch(error){

        console.error(error);

        alert(
            error.message||
            "Không thể xử lý ảnh."
        );

    }
}

async function saveData(){

    const name = document.getElementById("at-name").value.trim();
    const address= document.getElementById("at-address").value.trim();
    const map= document.getElementById("at-map").value.trim();
    const video= document.getElementById("at-video").value.trim();
    const content= getHtml("at-editor");
    if(name===""){
        alert("Nhập tên món ăn.");
        return;
    }

    if(editId===""){
        editId="at"+Date.now();
    }

    DATA[editId]={
        name,
        address,
        map,
        video,
        content,
        image:imageBase64,
        updated_at:Date.now()
    };

    await writeData("admin/amthuc",DATA);
    alert("Đã lưu.");
    clearForm();
    await loadData();
}

window.editAmThuc=function(id){
    const r=DATA[id];
    if(!r)return;
    editId=id;
    imageBase64=r.image||"";
    document.getElementById("at-name").value=r.name||"";
    document.getElementById("at-address").value=r.address||"";
    document.getElementById("at-map").value=r.map||"";
    document.getElementById("at-video").value=r.video||"";
    setHtml("at-editor",r.content||"");
    const img= document.getElementById("at-preview");
    if(imageBase64){
        img.src=imageBase64;
        img.style.display="block";
    }else{
        img.removeAttribute("src");
        img.style.display="none";
    }

    window.scrollTo({top:0,behavior:"smooth"});
};

window.deleteAmThuc=async function(id){
    if(!confirm("Xóa món ăn này?"))return;
    delete DATA[id];
    await writeData("admin/amthuc",DATA);
    await loadData();
};

function clearForm(){
    editId="";
    imageBase64="";
    document.getElementById("at-name").value="";
    document.getElementById("at-address").value="";
    document.getElementById("at-map").value="";
    document.getElementById("at-video").value="";
    document.getElementById("at-image-file").value="";
    setHtml("at-editor","");
    const img=document.getElementById("at-preview");
    img.removeAttribute("src");
    img.style.display="none";
}