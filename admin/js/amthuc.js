//======================================================
// HIENLUONG WEBSITE
// File : admin/js/amthuc.js
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
        imageBase64= await compressImage(file,"image");
        const img= document.getElementById("at-preview");
        img.src=imageBase64;
        img.style.display="block";

    }catch(error){
        console.error(error);
        alert(error.message||"Không thể xử lý ảnh.");
    }
}


async function saveData(){

    const name = document.getElementById("at-name").value.trim();
    const address = document.getElementById("at-address").value.trim();
    const map = document.getElementById("at-map").value.trim();
    const video = document.getElementById("at-video").value.trim();
    const content = getHtml("at-editor");

    if(name===""){
        alert("Nhập tên món ăn.");
        return;
    }

    if(editId===""){
        editId="at"+Date.now();
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
        const file = new File([blob],"amthuc.jpg",{type:"image/jpeg"});
        const media = await uploadToCloudinary(file,"hienluong/admin/amthuc");
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
        updated_at:Date.now()
    };

    const firebaseOK = await writeData("admin/amthuc",DATA);

    if(!firebaseOK){
        throw new Error("Firebase lưu dữ liệu thất bại.");
    }

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
                                    publicId
                            })
                    }
                );

            const result = await response.json();

            if(
                !response.ok ||
                !result.success
            ){
                throw new Error(result.result ||"Cloudinary xóa ảnh thất bại.");
            }
          }

        //==================================================
        // 2. XÓA RECORD FIREBASE
        //==================================================

        delete DATA[id];
        const firebaseOK = await writeData("admin/amthuc",DATA);
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
        console.error("❌ DELETE ẨM THỰC ERROR:",error);
        alert("❌ Không thể xóa món ăn.\n\n" + error.message);
    }
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