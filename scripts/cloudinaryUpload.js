//======================================================
// HIENLUONG WEBSITE
// File : cloudinaryUpload.js
// Cloudinary Upload Helper dùng chung
//======================================================

import {writeData} from "./firebaseService.js";

const CLOUDINARY_CLOUD_NAME =  "langrenhienluong";
const CLOUDINARY_UPLOAD_PRESET = "hienluong_upload";
const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/" + CLOUDINARY_CLOUD_NAME + "/upload";


//======================================================
// UPLOAD FILE → CLOUDINARY
//======================================================

export async function uploadToCloudinary(
    file,
    folder = "hienluong"
) {

    //==================================================
    // KIỂM TRA FILE
    //==================================================

    if (!file) {
        throw new Error("Chưa có file để upload");
    }


    //==================================================
    // TẠO FORM DATA
    //==================================================

    const formData = new FormData();
    formData.append("file",file);
    formData.append("upload_preset",CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder",folder);


    //==================================================
    // UPLOAD
    //==================================================

    const response = await fetch(CLOUDINARY_UPLOAD_URL,{method: "POST",body: formData});


    //==================================================
    // ĐỌC KẾT QUẢ
    //==================================================

    const data = await response.json();


    //==================================================
    // CLOUDINARY ERROR
    //==================================================

    if (!response.ok) {
        console.error("❌ CLOUDINARY UPLOAD ERROR:",data);
        throw new Error(data.error?.message || "Cloudinary upload thất bại");
    }


    //==================================================
    // TRẢ KẾT QUẢ
    //==================================================

    return {
        success: true,
        public_id: data.public_id || "",
        secure_url: data.secure_url || "",
        resource_type: data.resource_type || "",
        format: data.format || "",
        original_filename: data.original_filename || file.name,
        bytes: data.bytes || file.size,
        width: data.width || null,
        height: data.height || null,
        created_at: data.created_at || "",
        raw: data
    };
}

//======================================================
// SAVE CLOUDINARY METADATA → FIREBASE
//======================================================

export async function saveCloudinaryMetadata(
    firebasePath,
    media,
    extraData = {}
) {
    if (!firebasePath) {
        throw new Error("Thiếu Firebase path");
    }

    if (!media || !media.secure_url) {
        throw new Error("Cloudinary metadata không hợp lệ");
    }

    const metadata = {
	public_id: media.public_id || "",
        secure_url: media.secure_url || "",
        filename: media.original_filename || "",
        content_type: media.raw?.resource_type === "image" ? "image/" + (media.format || ""): "",
        format: media.format || "",
        size: media.bytes || 0,
        width: media.width || null,
        height: media.height || null,
        created_at: Date.now(),
        ...extraData
    };

    const firebaseOK = await writeData(firebasePath,metadata);
    if (!firebaseOK) {
        throw new Error("Firebase ghi metadata thất bại");
    }


    return metadata;
}