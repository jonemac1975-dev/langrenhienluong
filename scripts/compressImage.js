//======================================================
// HIENLUONG WEBSITE
// File : /scripts/compressImage.js
// Mục đích:
// Nén + resize ảnh trước khi lưu Base64 / Firebase
//======================================================

export function compressImage(
    file,
    type = "image"
){

    return new Promise(
        (resolve, reject) => {

            if(!file){
                reject(
                    new Error(
                        "Không có file ảnh."
                    )
                );
                return;
            }

            if(!file.type.startsWith("image/")){
                reject(
                    new Error(
                        "File không phải hình ảnh."
                    )
                );
                return;
            }

            const MAX_SIZE =
                type === "avatar"
                ? 800
                : 1200;

            const QUALITY =
                type === "avatar"
                ? 0.82
                : 0.80;

            const reader =
                new FileReader();

            reader.onload =
                function(){

                    const img =
                        new Image();

                    img.onload =
                        function(){

                            let width =
                                img.naturalWidth;

                            let height =
                                img.naturalHeight;

                            //==================================
                            // GIỮ NGUYÊN ẢNH NHỎ
                            // KHÔNG PHÓNG TO
                            //==================================

                            if(
                                width > MAX_SIZE ||
                                height > MAX_SIZE
                            ){

                                if(width >= height){

                                    height =
                                        Math.round(
                                            height *
                                            MAX_SIZE /
                                            width
                                        );

                                    width =
                                        MAX_SIZE;

                                }
                                else{

                                    width =
                                        Math.round(
                                            width *
                                            MAX_SIZE /
                                            height
                                        );

                                    height =
                                        MAX_SIZE;

                                }

                            }

                            const canvas =
                                document.createElement(
                                    "canvas"
                                );

                            canvas.width =
                                width;

                            canvas.height =
                                height;

                            const ctx =
                                canvas.getContext(
                                    "2d"
                                );

                            if(!ctx){

                                reject(
                                    new Error(
                                        "Không tạo được Canvas."
                                    )
                                );

                                return;
                            }

                            ctx.drawImage(
                                img,
                                0,
                                0,
                                width,
                                height
                            );

                            //==================================
                            // XUẤT JPEG
                            //==================================

                            const base64 =
                                canvas.toDataURL(
                                    "image/jpeg",
                                    QUALITY
                                );

                            resolve(
                                base64
                            );

                        };

                    img.onerror =
                        function(){

                            reject(
                                new Error(
                                    "Không đọc được ảnh."
                                )
                            );

                        };

                    img.src =
                        reader.result;

                };

            reader.onerror =
                function(){

                    reject(
                        new Error(
                            "Không đọc được file."
                        )
                    );

                };

            reader.readAsDataURL(
                file
            );

        }
    );
}