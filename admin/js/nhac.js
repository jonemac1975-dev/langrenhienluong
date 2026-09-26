import {readData,writeData} from "../../scripts/firebaseService.js";
import {uploadToCloudinary} from "../../scripts/cloudinaryUpload.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {app} from "../../scripts/firebaseConfig.js";

const auth = getAuth(app);

//======================================================
// HIENLUONG
// File : nhac.js
// BƯỚC 4 : FIREBASE + NHẬN DẠNG LINK
//======================================================

let LIST = [];
let EDIT_ID = null;

//======================================================
// INIT
//======================================================

export async function init(){
    bindEvents();
    await loadData();
}


//======================================================
// EVENTS
//======================================================

function bindEvents(){

//==================================================
// FILE ↔ LINK : CHỈ ĐƯỢC CHỌN 1 NGUỒN
//==================================================

const fileInput = document.getElementById("nhac-file");
const linkInput = document.getElementById("nhac-link");
const clearFileButton = document.getElementById("btn-nhac-clear-file");
if(fileInput && linkInput){
    fileInput.addEventListener(
        "change",
        ()=>{
            if(fileInput.files.length > 0){
                linkInput.value = "";
                linkInput.disabled = true;
                if(clearFileButton){
                    clearFileButton.style.display = "inline-block";
                }
            }
            else{
                linkInput.disabled = false;
                if(clearFileButton){
                    clearFileButton.style.display = "none";
                }
            }
        }
    );


    linkInput.addEventListener(
        "input",
        ()=>{

            if(linkInput.value.trim() !== ""){
                fileInput.value = "";
                fileInput.disabled = true;
                if(clearFileButton){
                    clearFileButton.style.display = "none";
                }
            }
            else{
                fileInput.disabled = false;
            }
        }
    );


    clearFileButton?.addEventListener(
        "click",
        ()=>{
            fileInput.value = "";
            fileInput.disabled = false;
            linkInput.disabled = false;
            if(clearFileButton){
                clearFileButton.style.display = "none";
            }
        }
    );
}

    document.getElementById("nhac-image-file")?.addEventListener("change",previewImage);
    document.getElementById("btn-nhac-cancel")?.addEventListener("click",resetForm);
    document.getElementById("btn-nhac-save")?.addEventListener("click",saveMusic);
    document.getElementById("nhac-body")?.addEventListener("click",handleListAction);
}


//======================================================
// LOAD FIREBASE
//======================================================

async function loadData(){
    try{
        const data = await readData("admin/nhac");
        if(!data){
            LIST = [];
        }else{
            LIST = Object.entries(data).map(([id,item])=>({
                id,
                ...item
            }));
        }
        renderList();
    }
    catch(error){
        console.error("❌ LOAD NHẠC ERROR:",error);
    }
}


//======================================================
// SAVE / UPDATE
//======================================================

async function saveMusic(){
    const title = document.getElementById("nhac-title").value.trim();
    const author = document.getElementById("nhac-author").value.trim();
    const link = document.getElementById("nhac-link").value.trim();
    const file = document.getElementById("nhac-file").files?.[0];


    //==================================================
    // KIỂM TRA
    //==================================================

    if(!title){ alert("Vui lòng nhập tên bài / tên phim.");
        return;
    }

    // Không được có cả File và Link
    if(file && link){
        alert("Chỉ được chọn file hoặc nhập link.");
        return;
    }
    if(!link && !file){
        alert("Vui lòng chọn file từ máy tính hoặc nhập link.");
        return;
    }


    //==================================================
    // BIẾN MEDIA
    //==================================================

    let mediaURL = link;
    let mediaType = detectMediaType(link);
    let mediaPublicId = "";
    let cloudinaryResourceType = "";
    let cloudinaryFormat = "";


    //==================================================
    // THÔNG TIN FILE CLOUDINARY CŨ
    //==================================================

	let oldPublicId = "";
	let oldItem = null;
	let imageFile = document.getElementById("nhac-image-file").files?.[0];
	let imageURL = "";
	let imagePublicId = "";
    if(EDIT_ID){
        oldItem =
            LIST.find(
                x => x.id === EDIT_ID
            );

        if(!oldItem){
            alert("Không tìm thấy dữ liệu cần sửa.");
            EDIT_ID = null;
            return;
        }
imageURL = oldItem.image_url || "";
imagePublicId = oldItem.image_public_id || "";
        oldPublicId = oldItem.media_public_id || "";
    }


    //==================================================
    // FILE → CLOUDINARY
    //==================================================

    if(file){
        try{
            const media = await uploadToCloudinary(file,"hienluong/nhac");
            mediaURL = media.secure_url;
            mediaPublicId = media.public_id;
            cloudinaryResourceType = media.resource_type;
            cloudinaryFormat = media.format;

            //==========================================
            // TỰ NHẬN DẠNG MP3 / MP4
            //==========================================

            if(
                media.format === "mp3"
            ){
                mediaType = "mp3";
            }
            else if(
                media.format === "mp4"
            ){
                mediaType ="mp4";
            }
            else{
                mediaType = detectMediaType(media.secure_url);
            }
        }
        catch(error){
            console.error("❌ UPLOAD MEDIA ERROR:",error);
            alert("Upload file lên Cloudinary thất bại:\n" + error.message);
            return;
        }
    }

if(imageFile){
    try{
        const image = await uploadToCloudinary(imageFile,"hienluong/nhac/images");
        imageURL = image.secure_url || "";
        imagePublicId = image.public_id || "";
    }
    catch(error){
        console.error("❌ UPLOAD IMAGE ERROR:",error);
        alert("Upload ảnh đại diện lên Cloudinary thất bại:\n" + error.message);
        return;
    }
}

    //==================================================
    // ĐANG SỬA
    //==================================================

    if(EDIT_ID){
        try{

            //================================================
            // KHÔNG CHỌN FILE MỚI
            // → ĐANG SỬA BẰNG LINK
            //================================================

            if(!file){
                mediaURL = link;
                mediaType = detectMediaType(link);

            // Nếu bài cũ là Cloudinary
            // thì chuẩn bị xóa file cũ sau khi Firebase OK

	    if(oldPublicId){
                    mediaPublicId = "";
                    cloudinaryResourceType = "";
                    cloudinaryFormat = "";
                }
            }


            //================================================
            // TẠO DỮ LIỆU UPDATE
            //================================================

            const updatedItem = {
                ...oldItem,
                title,
                author,
                link: mediaURL,
                media_type:mediaType,
		image_url:imageURL,
		image_public_id:imagePublicId,
                media_public_id:mediaPublicId,
                cloudinary_resource_type:cloudinaryResourceType,
                cloudinary_format:cloudinaryFormat,
                updated_at:Date.now()

            };


            //================================================
            // GHI FIREBASE TRƯỚC
            //================================================

            await writeData(
                `admin/nhac/${EDIT_ID}`,
                updatedItem
            );


            //================================================
            // SAU KHI FIREBASE OK
            // → XÓA CLOUDINARY CŨ
            //================================================

            if(
                oldPublicId
            ){
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
					     oldPublicId,
				          resource_type:
				      oldItem.cloudinary_resource_type ||
				"video"
				})
		                       }
			     );

                const result = await response.json();
console.log(
    "🗑️ CLOUDINARY DELETE RESPONSE:",
    {
        status: response.status,
        ok: response.ok,
        result
    }
);

                if(
                    !response.ok ||
                    !result.success
                ){

                    throw new Error(result.result || "Cloudinary xóa file cũ thất bại.");
                }
            }

            if(imageFile && oldItem.image_public_id){
                const user = auth.currentUser;
                if(!user){
                    throw new Error("Chưa đăng nhập Firebase Auth.");
                }
                const token = await user.getIdToken(true);
                const response = await fetch("https://hienluong-auth-test.jonemac1975.workers.dev/cloudinary/delete",{
                    method:"POST",
                    headers:{
                        "Authorization":"Bearer " + token,
                        "Content-Type":"application/json"
                    },
                    body:JSON.stringify({
                        public_id:oldItem.image_public_id,
                        resource_type:"image"
                    })
                });
                const result = await response.json();
                console.log("🗑️ CLOUDINARY DELETE IMAGE RESPONSE:",{status:response.status,ok:response.ok,result});
                if(!response.ok || !result.success){
                    throw new Error(result.result || "Cloudinary xóa ảnh đại diện cũ thất bại.");
                }
            }

            alert("Đã cập nhật thành công.");
        }
        catch(error){
            console.error("❌ UPDATE NHẠC ERROR:",error);
            alert("Cập nhật thất bại:\n" + error.message);
            return;
        }
    }


    //==================================================
    // THÊM MỚI
    //==================================================

    else{
        try{
            const id = "nhac_" + Date.now();
            const item = {
                title,
                author,
                link: mediaURL,
                media_type:mediaType,
		image_url:imageURL,
		image_public_id:imagePublicId,
                media_public_id: mediaPublicId,
                cloudinary_resource_type: cloudinaryResourceType,
                cloudinary_format: cloudinaryFormat,
                active:true,
                created_at:Date.now(),
                updated_at:Date.now()
            };

            await writeData(`admin/nhac/${id}`,item);
            alert("Đã lưu nhạc thành công.");
        }
        catch(error){
            console.error("❌ SAVE NHẠC ERROR:",error);
            alert("Lưu nhạc thất bại:\n" + error.message);
            return;
        }
    }


    //==================================================
    // HOÀN TẤT
    //==================================================

    EDIT_ID = null;
    resetForm();
    await loadData();
}


//======================================================
// DETECT MEDIA TYPE
//======================================================

function detectMediaType(url){

    const value =
        url
        .toLowerCase()
        .trim();


    // MP3
    if(
        /\.mp3(\?|#|$)/i.test(value)
    ){

        return "mp3";

    }


    // MP4
    if(
        /\.mp4(\?|#|$)/i.test(value)
    ){

        return "mp4";

    }


    // YouTube
    if(
        value.includes("youtube.com") ||
        value.includes("youtu.be")
    ){

        return "youtube";

    }


    // Link khác
    return "link";

}


//======================================================
// RENDER LIST
//======================================================

function renderList(){

    const body =
        document.getElementById("nhac-body");

    if(!body)return;


    if(!LIST.length){

        body.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    Chưa có dữ liệu
                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML =
        LIST
        .map((item,index)=>`

            <tr>

                <td>
                    ${index + 1}
                </td>

                <td>
                    ${escapeHTML(item.title || "")}
                </td>

                <td>
                    ${escapeHTML(item.author || "")}
                </td>

                <td>
                    ${mediaTypeLabel(item.media_type)}
                </td>

                <td>

                    <button
                        type="button"
                        class="gt-btn nhac-toggle"
                        data-id="${item.id}"
                    >
                        ${item.active ? "👁️" : "🚫"}
                    </button>

                </td>

                <td>

                    <button
                        type="button"
                        class="gt-btn"
                        data-action="edit"
                        data-id="${item.id}"
                    >
                        Sửa
                    </button>

                    <button
                        type="button"
                        class="gt-btn"
                        data-action="delete"
                        data-id="${item.id}"
                    >
                        Xóa
                    </button>

                </td>

            </tr>

        `)
        .join("");


    //==================================================
    // BẬT / TẮT
    //==================================================

    body.querySelectorAll(".nhac-toggle")
        .forEach(button=>{

            button.addEventListener("click",async()=>{

                const id = button.dataset.id;

                const item =
                    LIST.find(x=>x.id === id);

                if(!item)return;

                try{

                    const {id:_,...dataWithoutId}=item;
await writeData(`admin/nhac/${id}`,{
    ...dataWithoutId,
    active:!item.active,
    updated_at:Date.now()
});

                    item.active = !item.active;

                    renderList();

                }
                catch(error){

                    console.error(
                        "❌ LỖI BẬT/TẮT NHẠC:",
                        error
                    );

                    alert(
                        "Không thể thay đổi trạng thái."
                    );

                }

            });

        });

}


//======================================================
// LIST ACTION
//======================================================

function handleListAction(event){

    const button =
        event.target.closest("button");

    if(!button)return;


    const action =
        button.dataset.action;

    const id =
        button.dataset.id;


    //==================================================
    // XÓA
    //==================================================

    if(action === "delete"){

        deleteMusic(id);

        return;

    }


    //==================================================
    // SỬA
    //==================================================

    if(action !== "edit")return;


    const item =
        LIST.find(x=>x.id === id);

    if(!item)return;


    EDIT_ID = id;


    document
        .getElementById("nhac-title")
        .value =
        item.title || "";


    document
        .getElementById("nhac-author")
        .value =
        item.author || "";


    const editFileInput =
    document.getElementById("nhac-file");

const editLinkInput =
    document.getElementById("nhac-link");

const editClearFileButton =
    document.getElementById(
        "btn-nhac-clear-file"
    );

//==================================================
// SỬA BÀI TỪ FILE CLOUDINARY
//==================================================

if(item.media_public_id){

    // Không đổ file Cloudinary vào input file
    editFileInput.value = "";

    editFileInput.disabled = false;

    editLinkInput.value = "";
    editLinkInput.disabled = false;

    if(editClearFileButton){
        editClearFileButton.style.display =
            "none";
    }

}

//==================================================
// SỬA BÀI TỪ LINK
//==================================================

else{

    editFileInput.value = "";

    editFileInput.disabled = true;

    editLinkInput.value =
        item.link || "";

    editLinkInput.disabled = false;

    if(editClearFileButton){
        editClearFileButton.style.display =
            "none";
    }

}


    document
        .getElementById("nhac-image-file")
        .value = "";


    const preview =
        document.getElementById("nhac-preview");


    if(preview){

        preview.src =
            item.image_url || "";

        preview.style.display =
            item.image_url
                ? "block"
                : "none";

    }


    document
        .getElementById("btn-nhac-save")
        .textContent =
        "💾 Cập nhật";


    window.scrollTo({
        top:0,
        behavior:"smooth"
    });

}



async function deleteMusic(id){
    const item = LIST.find(x=>x.id === id);
    if(!item)return;

    const ok = confirm(`Anh có chắc muốn xóa "${item.title || "mục này"}" không?`);
    if(!ok)return;

    try{
        const user = auth.currentUser;
        if(!user){
            throw new Error("Chưa đăng nhập Firebase Auth.");
        }

        const token = await user.getIdToken(true);

        if(item.image_public_id){
            const response = await fetch("https://hienluong-auth-test.jonemac1975.workers.dev/cloudinary/delete",{
                method:"POST",
                headers:{
                    "Authorization":"Bearer " + token,
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    public_id:item.image_public_id,
                    resource_type:"image"
                })
            });

            const result = await response.json();
            console.log("🗑️ DELETE IMAGE RESPONSE:",{status:response.status,ok:response.ok,result});

            if(!response.ok || !result.success){
                throw new Error(result.result || "Cloudinary xóa ảnh đại diện thất bại.");
            }
        }

        if(item.media_public_id){
            const response = await fetch("https://hienluong-auth-test.jonemac1975.workers.dev/cloudinary/delete",{
                method:"POST",
                headers:{
                    "Authorization":"Bearer " + token,
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    public_id:item.media_public_id,
                    resource_type:item.cloudinary_resource_type || "video"
                })
            });

            const result = await response.json();
            console.log("🗑️ DELETE MEDIA RESPONSE:",{status:response.status,ok:response.ok,result});

            if(!response.ok || !result.success){
                throw new Error(result.result || "Cloudinary xóa media thất bại.");
            }
        }

        await writeData(`admin/nhac/${id}`,null);

        alert("Đã xóa thành công.");
        EDIT_ID = null;
        resetForm();
        await loadData();
    }
    catch(error){
        console.error("❌ DELETE NHẠC ERROR:",error);
        alert("Xóa thất bại:\n" + error.message);
    }
}

//======================================================
// MEDIA LABEL
//======================================================

function mediaTypeLabel(type){

    switch(type){

        case "mp3":
            return "🎵 MP3";

        case "mp4":
            return "🎬 MP4";

        case "youtube":
            return "▶️ YouTube";

        default:
            return "🔗 Link";

    }

}


//======================================================
// IMAGE PREVIEW
//======================================================

function previewImage(event){

    const file =
        event.target.files?.[0];

    const preview =
        document.getElementById("nhac-preview");


    if(!file){

        if(preview){

            preview.src = "";

            preview.style.display = "none";

        }

        return;

    }


    const reader =
        new FileReader();


    reader.onload = function(e){

        if(preview){

            preview.src =
                e.target.result;

            preview.style.display =
                "block";

            preview.style.maxWidth =
                "160px";

            preview.style.maxHeight =
                "120px";

        }

    };


    reader.readAsDataURL(file);

}


//======================================================
// RESET
//======================================================

function resetForm(){

    document
        .getElementById("nhac-title")
        .value = "";

    document
        .getElementById("nhac-author")
        .value = "";

    document
        .getElementById("nhac-link")
        .value = "";

    document
        .getElementById("nhac-file")
        .value = "";

const fileInput =
    document.getElementById("nhac-file");

const linkInput =
    document.getElementById("nhac-link");

const clearFileButton =
    document.getElementById(
        "btn-nhac-clear-file"
    );

if(fileInput){
    fileInput.disabled = false;
}

if(linkInput){
    linkInput.disabled = false;
}

if(clearFileButton){
    clearFileButton.style.display = "none";
}

    document
        .getElementById("nhac-image-file")
        .value = "";


    const preview =
        document.getElementById("nhac-preview");
    if(preview){

        preview.src = "";

        preview.style.display = "none";

    }

}


//======================================================
// ESCAPE HTML
//======================================================

function escapeHTML(value){

    return String(value)

        .replace(/&/g,"&amp;")

        .replace(/</g,"&lt;")

        .replace(/>/g,"&gt;")

        .replace(/"/g,"&quot;")

        .replace(/'/g,"&#039;");

}