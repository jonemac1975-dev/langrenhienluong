//======================================================
// HIENLUONG WEBSITE
// File : admin/js/danhnhan.js
//======================================================

import {readData,writeData} from "../../scripts/firebaseService.js";
import {createEditor,getHtml,setHtml} from "../../js/editor.js";
import {compressImage} from "../../scripts/compressImage.js";
import {uploadToCloudinary} from "../../scripts/cloudinaryUpload.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {app} from "../../scripts/firebaseConfig.js";

const auth=getAuth(app);
let DATA={};
let editId="";
let imageBase64="";
let imagePublicId="";

export async function init(){
    createEditor("dn-editor");
    bindEvents();
    await loadData();
}

function bindEvents(){
    document.getElementById("dn-image-file").onchange=loadImage;
    document.getElementById("btn-dn-save").onclick=saveData;
}

async function loadData(){
    DATA=await readData("admin/danhnhan")||{};
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
    const body=document.getElementById("dn-body");
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
                <button onclick="editDanhNhan('${id}')">
                    Sửa
                </button>

                <button onclick="deleteDanhNhan('${id}')">
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
        imageBase64= await compressImage(file,"image");
        const img= document.getElementById("dn-preview");
        img.src=imageBase64;
        img.style.display="block";
        
    }catch(error){
        console.error(error);
        alert(error.message||"Không thể xử lý ảnh.");
    }
}

async function saveData(){

    const name = document.getElementById("dn-name").value.trim();
    const address = document.getElementById("dn-address").value.trim();
    const map = document.getElementById("dn-map").value.trim();
    const video = document.getElementById("dn-video").value.trim();
    const content = getHtml("dn-editor");
    if(name===""){
        alert("Nhập tên Danh nhân.");
        return;
    }

    if(editId===""){
        editId="dn"+Date.now();
    }

    //==================================================
    // GIỮ ẢNH CŨ
    //==================================================

    let imageUrl = DATA[editId]?.image || "";
    let oldPublicId = DATA[editId]?.image_public_id || "";
    let imagePublicId = oldPublicId;

    //==================================================
    // UPLOAD ẢNH MỚI
    //==================================================

    if(imageBase64){
        const response = await fetch(imageBase64);
        const blob = await response.blob();
        const file =
            new File(
                [blob],
                "danhnhan.jpg",
                {
                    type:"image/jpeg"
                }
            );

        const media = await uploadToCloudinary(file,"hienluong/admin/danhnhan");
        imageUrl = media.secure_url;
        imagePublicId = media.public_id;

        //==================================================
        // XÓA ẢNH CŨ NẾU ĐANG THAY ẢNH
        //==================================================

        if(oldPublicId){
            const user = auth.currentUser;
            if(!user){
                throw new Error("Chưa đăng nhập Firebase Auth.");
            }
            const token = await user.getIdToken(true);
            const response =
                await fetch(
                    "https://hienluong-auth-test.jonemac1975.workers.dev/cloudinary/delete",
                    {
                        method:"POST",
                        headers:{
                            "Authorization":
                                "Bearer " + token,
                            "Content-Type":
                                "application/json"
                        },
                        body:
                            JSON.stringify({
                                public_id:
                                    oldPublicId
                            })
                    }
                );

            const result = await response.json();
            if(
                !response.ok ||
                !result.success
            ){
                throw new Error(
                    result.result ||
                    "Cloudinary xóa ảnh cũ thất bại."
                );
            }
         }
    }

    //==================================================
    // LƯU FIREBASE
    //==================================================

    DATA[editId]={
        name,
        address,
        map,
        video,
        content,
        image:imageUrl,
        image_public_id:imagePublicId,
        updated_at: Date.now()
    };
    const firebaseOK = await writeData("admin/danhnhan",DATA);
    if(!firebaseOK){
        throw new Error("Firebase lưu dữ liệu thất bại.");
    }
    alert("Đã lưu.");
    clearForm();
    await loadData();
}

window.editDanhNhan=function(id){
    const r=DATA[id];
    if(!r)return;
    editId=id;
    imageBase64=r.image||"";
    document.getElementById("dn-name").value=r.name||"";
    document.getElementById("dn-address").value=r.address||"";
    document.getElementById("dn-map").value=r.map||"";
    document.getElementById("dn-video").value=r.video||"";
    setHtml("dn-editor",r.content||"");
    const img= document.getElementById("dn-preview");
    if(imageBase64){
        img.src=imageBase64;
        img.style.display="block";
    }else{
        img.removeAttribute("src");
        img.style.display="none";
    }

    window.scrollTo({top:0,behavior:"smooth"});
};


window.deleteDanhNhan=async function(id){

    if(!confirm("Xóa Danh nhân này?"))return;
    const record = DATA[id];
    if(!record){
        alert("❌ Không tìm thấy dữ liệu.");
        return;
    }
    try{

        //==================================================
        // 1. XÓA ẢNH CLOUDINARY NẾU CÓ
        //==================================================

        const publicId = record.image_public_id || "";
        if(publicId){
            const user = auth.currentUser;
            if(!user){
                throw new Error(
                    "Chưa đăng nhập Firebase Auth."
                );
            }
            const token = await user.getIdToken(true);
            const response =
                await fetch(
                    "https://hienluong-auth-test.jonemac1975.workers.dev/cloudinary/delete",
                    {
                        method:"POST",
                        headers:{
                            "Authorization":
                                "Bearer " + token,
                            "Content-Type":
                                "application/json"
                        },
                        body:
                            JSON.stringify({
                                public_id:
                                    publicId
                            })
                    }
                );

            const result = await response.json();
            if(
                !response.ok ||
                !result.success
            ){
                throw new Error(
                    result.result ||
                    "Cloudinary xóa ảnh thất bại."
                );
            }
         }

        //==================================================
        // 2. XÓA RECORD FIREBASE
        //==================================================

        delete DATA[id];
        const firebaseOK = await writeData("admin/danhnhan",DATA);
        if(!firebaseOK){
            throw new Error("Firebase xóa dữ liệu thất bại.");
        }

        //==================================================
        // 3. HOÀN TẤT
        //==================================================

        alert("Đã xóa.");
        clearForm();
        await loadData();

    }
    catch(error){
        console.error(
            "❌ DELETE DANH NHÂN ERROR:",
            error
        );
        alert("❌ Không thể xóa Danh nhân.\n\n" + error.message);
    }
};

function clearForm(){
    editId="";
    imageBase64="";
    document.getElementById("dn-name").value="";
    document.getElementById("dn-address").value="";
    document.getElementById("dn-map").value="";
    document.getElementById("dn-video").value="";
    document.getElementById("dn-image-file").value="";
    setHtml("dn-editor","");
    const img=document.getElementById("dn-preview");
    img.removeAttribute("src");
    img.style.display="none";
}