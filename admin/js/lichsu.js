import{readData,writeData,removeData}from "../../scripts/firebaseService.js";
import{createEditor,getHtml,setHtml}from "../../js/editor.js";
import{compressImage}from "../../scripts/compressImage.js";
import {uploadToCloudinary,saveCloudinaryMetadata} from "../../scripts/cloudinaryUpload.js";
import{getAuth}from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import{app}from "../../scripts/firebaseConfig.js";

const auth=getAuth(app);

let DATA={};
let editId="";
let imageBase64="";

export async function init(){
createEditor("ls-editor");
bindEvents();
await loadData();
}

function bindEvents(){
document.getElementById("ls-image-file").onchange=loadImage;
document.getElementById("btn-ls-save").onclick=saveData;
}

async function loadData(){
DATA=await readData("admin/lichsu")||{};
renderTable();
}

function renderTable(){
const body=document.getElementById("ls-body");
body.innerHTML="";
let stt=1;

Object.keys(DATA).sort().forEach(id=>{
const r=DATA[id];

body.innerHTML+=`
<tr>
<td>${stt++}</td>
<td>${r.year||""}</td>
<td>${r.title||""}</td>
<td>${r.source||""}</td>
<td>${r.video ? "🎥 Có" : "-"}</td>
<td>
<button onclick="window.editLichSu('${id}')">Sửa</button>
<button onclick="window.deleteLichSu('${id}')">Xóa</button>
</td>
</tr>`;
});
}

async function loadImage(e){

    const file = e.target.files[0];
    if(!file)return;
    try{
        const compressed = await compressImage(file,"image");
        imageBase64 = compressed;
        const img = document.getElementById("ls-preview");
        img.src = imageBase64;
        img.style.display = "block";
    }
    catch(error){
        console.error("❌ IMAGE ERROR:",error);
        alert(error.message || "Không thể xử lý ảnh.");
    }
}


async function saveData(){
    const year = document.getElementById("ls-year").value.trim();
    const title = document.getElementById("ls-title").value.trim();
    const content = getHtml("ls-editor");
    const source = document.getElementById("ls-source").value.trim();
    const video = document.getElementById("ls-video").value.trim();
    if(year==="" || title===""){
        alert("Nhập năm và tiêu đề.");
        return;
    }


    if(editId==="")
        editId="ls"+Date.now();
    try{
        let imageUrl = DATA[editId]?.image || "";
	let imagePublicId = DATA[editId]?.image_public_id || "";
	const oldImagePublicId = DATA[editId]?.image_public_id || "";

        //==================================================
        // UPLOAD ẢNH → CLOUDINARY
        //==================================================

        if(imageBase64){

            /*
            imageBase64 hiện là ảnh đã nén.
            Chuyển Base64 → Blob → File
            */

            const response = await fetch(imageBase64);
            const blob = await response.blob();
            const file =
                new File(
                    [blob],
                    "lichsu-" + editId + ".jpg",
                    {
                        type:"image/jpeg"
                    }
                );

            const media = await uploadToCloudinary(file,"hienluong/admin/lichsu");
            imageUrl = media.secure_url;
	    imagePublicId = media.public_id || "";

         //==================================================
        // XÓA ẢNH CLOUDINARY CŨ
        //==================================================

        if(
            oldImagePublicId &&
            oldImagePublicId !== imagePublicId
        ){
            const user = auth.currentUser;
            if(!user){
                throw new Error("Chưa đăng nhập Firebase Auth.");
            }

            const token = await user.getIdToken(true);
            const deleteResponse =
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
                                    oldImagePublicId
                            })
                    }
                );

            const deleteResult = await deleteResponse.json();
            if(
                !deleteResponse.ok ||
                !deleteResult.success
            ){
                throw new Error("Không thể xóa ảnh Cloudinary cũ.");
            }
          }
       }


        //==================================================
        // LƯU FIREBASE
        //==================================================

        DATA[editId]={
            year,
            title,
            content,
            source,
            video,
            image: imageUrl,
	    image_public_id:imagePublicId,
            updated_at: Date.now()

        };

        const firebaseOK = await writeData("admin/lichsu",DATA);
        if(!firebaseOK){
            throw new Error("Firebase ghi dữ liệu thất bại.");
        }
        alert("Đã lưu.");
        clearForm();
        await loadData();
    }
    catch(error){
        console.error("❌ LƯU LỊCH SỬ ERROR:",error);
        alert(error.message ||"Không thể lưu dữ liệu.");
    }
}


window.editLichSu=function(id){

    const r=DATA[id];
    if(!r)return;
    editId=id;

    //==================================================
    // ẢNH
    //==================================================

    // Không đưa URL Cloudinary cũ vào imageBase64
    imageBase64="";
    document.getElementById("ls-year").value= r.year||"";
    document.getElementById("ls-title").value= r.title||"";
    document.getElementById("ls-source").value= r.source||"";
    document.getElementById("ls-video").value= r.video||"";
    setHtml("ls-editor",r.content||"");
    const img= document.getElementById("ls-preview");
    if(r.image){
        img.src= r.image;
        img.style.display= "block";
    }else{
        img.src="";
        img.style.display= "none";
    }
    window.scrollTo({
        top:0,
        behavior:"smooth"
    });
};

window.deleteLichSu=async function(id){

    if(!confirm("Xóa sự kiện này?"))return;
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
                throw new Error(result.result || "Cloudinary xóa ảnh thất bại.");
            }
         }

        //==================================================
        // 2. XÓA RECORD FIREBASE
        //==================================================

        delete DATA[id];
        const firebaseOK = await writeData("admin/lichsu",DATA);

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
        console.error("❌ DELETE LỊCH SỬ ERROR:",error);
        alert("❌ Không thể xóa sự kiện.\n\n" + error.message);
    }
};


function clearForm(){
editId="";
imageBase64="";

document.getElementById("ls-year").value="";
document.getElementById("ls-title").value="";
document.getElementById("ls-source").value="";
document.getElementById("ls-video").value="";
document.getElementById("ls-image-file").value="";

setHtml("ls-editor","");
const img=document.getElementById("ls-preview");
img.removeAttribute("src");
img.style.display="none";
}