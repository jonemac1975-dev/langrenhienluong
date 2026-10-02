//======================================================
// HIENLUONG WEBSITE
// File : /hangkinh/js/hangkinhupdate.js
// Cập nhật hoạt động Hàng Kỉnh
//======================================================

import{readData,writeData}from "../../scripts/firebaseService.js";
import{uploadToCloudinary}from "../../scripts/cloudinaryUpload.js";
import{createEditor,getHtml,setHtml}from "../../js/editor.js";
import{getAuth,onAuthStateChanged}from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import{app}from "../../scripts/firebaseConfig.js";

const params=new URLSearchParams(window.location.search);
const HANG_KINH_ID=params.get("id")||"";
const HANG_KINH_USER=params.get("user")||"";

const CLOUDINARY_DELETE_URL="https://hienluong-auth-test.jonemac1975.workers.dev/cloudinary/delete";

let LIST=[];
let EDIT_ID="";
let OLD_IMAGE_PUBLIC_ID="";
let OLD_IMAGE_URL="";
let REMOVE_OLD_IMAGE=false;
let IMAGE_FILE=null;

//======================================================
// INIT
//======================================================

async function init(){
    if(!HANG_KINH_ID){
        console.warn("⚠️ TRANG UPDATE KHÔNG CÓ ID.");
        window.location.replace("/");
        return;
    }

    const auth=getAuth(app);

    onAuthStateChanged(auth,async user=>{
        if(!user){
            console.warn("⚠️ HÀNG KỈNH UPDATE CHƯA ĐĂNG NHẬP.");
            window.location.replace("/");
            return;
        }

        const verified=await verifyHangKinh(user.uid);

        if(!verified){
            return;
        }

        await startPage();
    });
}

//======================================================
// VERIFY HÀNG KỈNH
//======================================================

async function verifyHangKinh(uid){
    try{
        const data=await readData(`admin/hangkinh/${HANG_KINH_ID}`);

        if(!data){
            console.warn("⚠️ KHÔNG TÌM THẤY HÀNG KỈNH:",HANG_KINH_ID);
            window.location.replace("/");
            return false;
        }

        if(!data.uid||data.uid!==uid){
            console.warn("❌ UID HÀNG KỈNH UPDATE KHÔNG KHỚP");

            const auth=getAuth(app);
            await auth.signOut();

            window.location.replace("/");
            return false;
        }

        return true;
    }
    catch(error){
        console.error("❌ VERIFY UPDATE HÀNG KỈNH ERROR:",error);

        const auth=getAuth(app);
        await auth.signOut();

        window.location.replace("/");
        return false;
    }
}

//======================================================
// START PAGE
//======================================================

async function startPage(){
    createEditor("hk-editor");

    const id=document.getElementById("hk-id");
    const user=document.getElementById("hk-user");
    const listId=document.getElementById("hk-list-id");
    const listUser=document.getElementById("hk-list-user");
    const updater=document.getElementById("hk-updater");
    const date=document.getElementById("hk-date");

    if(id)id.value=HANG_KINH_ID;
    if(user)user.value=HANG_KINH_USER;
    if(listId)listId.textContent=HANG_KINH_ID;
    if(listUser)listUser.textContent=HANG_KINH_USER;

    if(updater)updater.value=HANG_KINH_USER;
    if(date)date.value=getToday();

    document.getElementById("hk-home")?.addEventListener("click",()=>{
        window.location.href="/";
    });

    document.getElementById("hk-image")?.addEventListener("change",handleImageSelect);
    document.getElementById("hk-image-delete")?.addEventListener("click",clearImage);
    document.getElementById("hk-save")?.addEventListener("click",saveActivity);
    document.getElementById("hk-cancel")?.addEventListener("click",cancelEdit);

    await loadActivities();

    
}

//======================================================
// TODAY
//======================================================

function getToday(){
    const now=new Date();
    const year=now.getFullYear();
    const month=String(now.getMonth()+1).padStart(2,"0");
    const day=String(now.getDate()).padStart(2,"0");
    return `${year}-${month}-${day}`;
}

//======================================================
// LOAD ACTIVITIES
//======================================================

async function loadActivities(){
    const body=document.getElementById("hk-body");

    if(!body)return;

    body.innerHTML=`
        <tr>
            <td colspan="7">Đang tải...</td>
        </tr>
    `;

    try{
        const data=await readData("hangkinh/activities");

        if(!data){
            LIST=[];
            renderList();
            return;
        }

        LIST=Object.entries(data)
            .map(([id,item])=>({
                id,
                ...item
            }))
            .filter(item=>{
                return String(item.hangkinh_id||"")===String(HANG_KINH_ID)&&
                       String(item.user||"")===String(HANG_KINH_USER);
            })
            .sort((a,b)=>{
                return String(b.date||"").localeCompare(String(a.date||""));
            });

        renderList();

        
    }
    catch(error){
        console.error("❌ LOAD HÀNG KỈNH ACTIVITIES ERROR:",error);

        body.innerHTML=`
            <tr>
                <td colspan="7">Không thể tải danh sách hoạt động.</td>
            </tr>
        `;
    }
}

//======================================================
// RENDER LIST
//======================================================

function renderList(){
    const body=document.getElementById("hk-body");

    if(!body)return;

    if(!LIST.length){
        body.innerHTML=`
            <tr>
                <td colspan="7">Chưa có hoạt động nào.</td>
            </tr>
        `;
        return;
    }

    body.innerHTML="";

    LIST.forEach((item,index)=>{
        const row=document.createElement("tr");

        row.innerHTML=`
            <td>${index+1}</td>
            <td>${escapeHtml(item.type||"")}</td>
            <td>
                ${
                    item.image
                    ? `<img src="${escapeAttribute(item.image)}" class="hk-table-image" alt="">`
                    : "—"
                }
            </td>
            <td>${escapeHtml(item.date||"")}</td>
            <td>${escapeHtml(item.title||"")}</td>
            <td>${escapeHtml(item.updater||"")}</td>
            <td>
                <button type="button" class="hk-edit-btn">Sửa</button>
                <button type="button" class="hk-delete-btn">Xóa</button>
            </td>
        `;

        row.querySelector(".hk-edit-btn").addEventListener("click",()=>{
            editActivity(item.id);
        });

        row.querySelector(".hk-delete-btn").addEventListener("click",()=>{
            deleteActivity(item.id);
        });

        body.appendChild(row);
    });
}

//======================================================
// IMAGE SELECT
//======================================================

function handleImageSelect(event){
    const file=event.target.files?.[0];

    if(!file)return;

    IMAGE_FILE=file;
    REMOVE_OLD_IMAGE=false;

    const preview=document.getElementById("hk-image-preview");

    if(preview){
        preview.src=URL.createObjectURL(file);
        preview.style.display="block";
    }
}

//======================================================
// CLEAR IMAGE
//======================================================

function clearImage(){
    IMAGE_FILE=null;
    REMOVE_OLD_IMAGE=true;

    const input=document.getElementById("hk-image");
    const preview=document.getElementById("hk-image-preview");

    if(input)input.value="";

    if(preview){
        preview.src="";
        preview.style.display="none";
    }
}

//======================================================
// SAVE
//======================================================

async function saveActivity(){
    const type=document.getElementById("hk-type")?.value.trim()||"";
    const title=document.getElementById("hk-title")?.value.trim()||"";
    const content=getHtml("hk-editor");
    const updater=document.getElementById("hk-updater")?.value.trim()||"";
    const date=document.getElementById("hk-date")?.value||"";

    if(!HANG_KINH_ID||!HANG_KINH_USER){
        alert("❌ Không xác định được Hàng Kỉnh đăng nhập.");
        return;
    }

    if(!title){
        alert("❌ Vui lòng nhập tiêu đề.");
        return;
    }

    if(!content.trim()){
        alert("❌ Vui lòng nhập nội dung hoạt động.");
        return;
    }

    if(!updater){
        alert("❌ Vui lòng nhập người cập nhật.");
        return;
    }

    if(!date){
        alert("❌ Vui lòng chọn ngày.");
        return;
    }

    const saveButton=document.getElementById("hk-save");

    if(saveButton){
        saveButton.disabled=true;
        saveButton.textContent="⏳ Đang lưu...";
    }

    try{
        let image=OLD_IMAGE_URL;
        let image_public_id=OLD_IMAGE_PUBLIC_ID;

        if(REMOVE_OLD_IMAGE){
            if(OLD_IMAGE_PUBLIC_ID){
                await deleteCloudinaryImage(OLD_IMAGE_PUBLIC_ID);
            }

            image="";
            image_public_id="";
        }

        if(IMAGE_FILE){
            const result=await uploadToCloudinary(
                IMAGE_FILE,
                "hienluong/hangkinh"
            );

            image=result.secure_url||"";
            image_public_id=result.public_id||"";

            if(OLD_IMAGE_PUBLIC_ID&&OLD_IMAGE_PUBLIC_ID!==image_public_id){
                await deleteCloudinaryImage(OLD_IMAGE_PUBLIC_ID);
            }
        }

        const id=EDIT_ID||`hkact_${Date.now()}`;

        const item={
            hangkinh_id:HANG_KINH_ID,
            user:HANG_KINH_USER,
            type,
            title,
            image,
            image_public_id,
            content,
            updater,
            date,
            updated_at:Date.now()
        };

        await writeData(`hangkinh/activities/${id}`,item);

        alert(EDIT_ID?"✅ Đã cập nhật hoạt động.":"✅ Đã lưu hoạt động.");

        resetForm();
        await loadActivities();
    }
    catch(error){
        console.error("❌ SAVE HÀNG KỈNH ACTIVITY ERROR:",error);
        alert("❌ Không thể lưu hoạt động.");
    }
    finally{
        if(saveButton){
            saveButton.disabled=false;
            saveButton.textContent="💾 Lưu";
        }
    }
}

//======================================================
// EDIT
//======================================================

async function editActivity(id){
    const item=LIST.find(row=>row.id===id);

    if(!item)return;

    EDIT_ID=id;

    document.getElementById("hk-type").value=item.type||"Tin hoạt động";
    document.getElementById("hk-title").value=item.title||"";
    document.getElementById("hk-updater").value=item.updater||HANG_KINH_USER;
    document.getElementById("hk-date").value=item.date||getToday();

    setHtml("hk-editor",item.content||"");

    OLD_IMAGE_URL=item.image||"";
    OLD_IMAGE_PUBLIC_ID=item.image_public_id||"";
    REMOVE_OLD_IMAGE=false;
    IMAGE_FILE=null;

    const input=document.getElementById("hk-image");
    const preview=document.getElementById("hk-image-preview");

    if(input)input.value="";

    if(preview){
        if(OLD_IMAGE_URL){
            preview.src=OLD_IMAGE_URL;
            preview.style.display="block";
        }else{
            preview.src="";
            preview.style.display="none";
        }
    }

    document.getElementById("hk-cancel").style.display="inline-block";

    window.scrollTo({
        top:0,
        behavior:"smooth"
    });
}

//======================================================
// DELETE
//======================================================

async function deleteActivity(id){
    const item=LIST.find(row=>row.id===id);

    if(!item)return;

    if(!confirm(`Xóa hoạt động "${item.title||""}"?`)){
        return;
    }

    try{
        if(item.image_public_id){
            await deleteCloudinaryImage(item.image_public_id);
        }

        await writeData(`hangkinh/activities/${id}`,null);

        alert("✅ Đã xóa hoạt động.");

        await loadActivities();
    }
    catch(error){
        console.error("❌ DELETE HÀNG KỈNH ACTIVITY ERROR:",error);
        alert("❌ Không thể xóa hoạt động.");
    }
}

//======================================================
// DELETE CLOUDINARY
//======================================================

async function deleteCloudinaryImage(publicId){
    if(!publicId)return;

    const auth=getAuth(app);

    if(!auth.currentUser){
        throw new Error("Chưa đăng nhập Firebase Auth.");
    }

    const token=await auth.currentUser.getIdToken(true);

    const response=await fetch(CLOUDINARY_DELETE_URL,{
        method:"POST",
        headers:{
            "Content-Type":"application/json",
            "Authorization":`Bearer ${token}`
        },
        body:JSON.stringify({
            public_id:publicId
        })
    });

    if(!response.ok){
        throw new Error(`Cloudinary delete HTTP ${response.status}`);
    }
}

//======================================================
// RESET FORM
//======================================================

function resetForm(){
    EDIT_ID="";
    OLD_IMAGE_PUBLIC_ID="";
    OLD_IMAGE_URL="";
    REMOVE_OLD_IMAGE=false;
    IMAGE_FILE=null;

    document.getElementById("hk-type").value="Tin hoạt động";
    document.getElementById("hk-title").value="";
    setHtml("hk-editor","");
    document.getElementById("hk-updater").value=HANG_KINH_USER;
    document.getElementById("hk-date").value=getToday();

    const input=document.getElementById("hk-image");
    const preview=document.getElementById("hk-image-preview");

    if(input)input.value="";

    if(preview){
        preview.src="";
        preview.style.display="none";
    }

    document.getElementById("hk-cancel").style.display="none";
}

//======================================================
// CANCEL EDIT
//======================================================

function cancelEdit(){
    resetForm();
}

//======================================================
// ESCAPE
//======================================================

function escapeHtml(value){
    return String(value??"")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}

function escapeAttribute(value){
    return String(value??"").replace(/"/g,"&quot;");
}

//======================================================

init();