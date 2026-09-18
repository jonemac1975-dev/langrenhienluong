//======================================================
// HIENLUONG WEBSITE
// File : /admin/backup.js
// MODULE : BACKUP & RESTORE FIREBASE
//======================================================

import {readData,writeData} from "../../scripts/firebaseService.js";
let RESTORE_DATA = null;
//======================================================
// INIT
//======================================================

export async function init(){
    //==================================================
    // BACKUP
    //==================================================
    const backupButton = document.getElementById("btn-backup");
    if(backupButton){
        backupButton.onclick = backupFirebase;
    }

    //==================================================
    // RESTORE
    //==================================================

    const restoreButton = document.getElementById("btn-restore");
    const restoreFile = document.getElementById("restore-file");
    if(
        restoreButton &&
        restoreFile
    ){
        restoreButton.onclick = ()=>{
            restoreFile.click();
        };

        restoreFile.onchange = handleRestoreFile;
    }
const cancelRestore = document.getElementById("btn-cancel-restore");
if(cancelRestore){
    cancelRestore.onclick = ()=>{
        RESTORE_DATA = null;
        const confirmBox = document.getElementById("restore-confirm");
        if(confirmBox){
            confirmBox.style.display = "none";
        }
        const status = document.getElementById("backup-status");
        if(status){
            status.textContent ="Đã hủy Restore.";
        }
    };

}
const confirmRestore = document.getElementById("btn-confirm-restore");
if(confirmRestore){
    confirmRestore.onclick = restoreFirebase;
}
}

//======================================================
// RESTORE FIREBASE
//======================================================

async function restoreFirebase(){
    const button = document.getElementById("btn-confirm-restore");
    const status = document.getElementById("backup-status");
    const confirmBox = document.getElementById("restore-confirm");

    //----------------------------------------------
    // KIỂM TRA DỮ LIỆU
    //----------------------------------------------

    if(
        !RESTORE_DATA ||
        typeof RESTORE_DATA !== "object"
    ){
        if(status){
            status.textContent ="❌ Không có dữ liệu backup để Restore.";
        }
        return;
    }

    //----------------------------------------------
    // KHÓA NÚT
    //----------------------------------------------

    if(button){
        button.disabled = true;
        button.textContent = "⏳ Đang Restore...";
    }
    if(status){
        status.textContent = "⏳ Đang ghi dữ liệu backup vào Firebase...";
    }
    try{

        //------------------------------------------
        // GHI TOÀN BỘ DATABASE
        //------------------------------------------

        const result = await writeData("/",RESTORE_DATA);

        //------------------------------------------
        // KIỂM TRA KẾT QUẢ
        //------------------------------------------

        if(result === false){
            throw new Error("writeData trả về false.");
        }

        //------------------------------------------
        // THÀNH CÔNG
        //------------------------------------------

        RESTORE_DATA = null;
        if(confirmBox){
            confirmBox.style.display = "none";

        }
        if(status){
            status.textContent = "✅ Restore Firebase thành công.";
        }
            }
    catch(error){
        console.error("❌ RESTORE FIREBASE ERROR:",error);
        if(status){
            status.textContent = "❌ Restore thất bại. Xem Console để biết chi tiết.";
        }
    }
    finally{
        if(button){
            button.disabled = false;
            button.textContent = "♻️ Xác nhận Restore";
        }
    }
}
//======================================================
// BACKUP FIREBASE
//======================================================

async function backupFirebase(){

    const button = document.getElementById("btn-backup");
    const status = document.getElementById("backup-status");
    if(button){
        button.disabled = true;
        button.textContent = "⏳ Đang backup...";
    }

    if(status){
        status.textContent = "Đang đọc dữ liệu Firebase...";
    }
    try{

        //----------------------------------------------
        // ĐỌC TOÀN BỘ DATABASE
        //----------------------------------------------

        const data = await readData("/");

        //----------------------------------------------
        // TẠO FILE JSON
        //----------------------------------------------

        const json = JSON.stringify(data,null,2);
        const blob = new Blob([json],{type:"application/json"});
        const url = URL.createObjectURL(blob);

        //----------------------------------------------
        // TÊN FILE
        //----------------------------------------------

        const now = new Date();
        const pad = value => String(value).padStart(2,"0");
        const fileName = "hienluong-backup-" + now.getFullYear() + "-" + pad(now.getMonth()+1) + "-" + pad(now.getDate()) + "-" + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds()) + ".json";

        //----------------------------------------------
        // DOWNLOAD
        //----------------------------------------------

        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();

      
        //----------------------------------------------
        // THÔNG BÁO
        //----------------------------------------------

        if(status){
            status.textContent = "✅ Backup thành công: " + fileName;
        }
    }
    catch(error){
        console.error("❌ BACKUP ERROR:",error);
        if(status){
            status.textContent ="❌ Backup thất bại. Xem Console để biết chi tiết.";
        }
    }
    finally{
        if(button){
            button.disabled = false;
            button.textContent ="💾 Backup dữ liệu";
        }
    }
}

//======================================================
// KIỂM TRA FILE RESTORE
// CHƯA GHI FIREBASE
//======================================================

async function handleRestoreFile(event){

    const file = event.target.files?.[0];
    if(!file){
        return;
    }
    const status = document.getElementById("backup-status");
    try{
        if(status){
            status.textContent = "⏳ Đang kiểm tra file backup...";
        }

        //----------------------------------------------
        // ĐỌC FILE
        //----------------------------------------------

        const text = await file.text();

        //----------------------------------------------
        // PARSE JSON
        //----------------------------------------------

        const data = JSON.parse(text);
        RESTORE_DATA = data;


        //----------------------------------------------
        // KIỂM TRA CƠ BẢN
        //----------------------------------------------

        if(
            data === null ||
            typeof data !== "object"
        ){
            throw new Error("File JSON không chứa dữ liệu hợp lệ."
            );
        }

        //----------------------------------------------
        // THÔNG TIN FILE
        //----------------------------------------------

        const sizeKB = (file.size / 1024).toFixed(1);
        const topKeys = Object.keys(data);
        
        //----------------------------------------------
        // HIỂN THỊ
        //----------------------------------------------

        if(status){
            status.innerHTML = `
                ✅ File backup hợp lệ.<br>
                📄 ${escapeHtml(file.name)}<br>
                📦 ${sizeKB} KB<br>
                🌳 ${topKeys.length} nhánh dữ liệu
            `;
        }

const confirmBox = document.getElementById("restore-confirm");

if(confirmBox){
    confirmBox.style.display = "block";
}
    }
    catch(error){
         RESTORE_DATA = null;
        console.error("❌ RESTORE FILE ERROR:",error);
        if(status){
            status.textContent ="❌ File JSON không hợp lệ.";
        }
    }
    finally{

        // Cho phép chọn lại cùng một file
        event.target.value = "";
    }
}

function escapeHtml(value){

    return String(value || "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");

}