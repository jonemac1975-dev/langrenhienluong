//======================================================
// HIENLUONG WEBSITE
// File : /js/bgmain.js
// Tối ưu tải ảnh slideshow
//======================================================

//======================================================
// CẤU HÌNH
//======================================================

const CHANGE_TIME = 7000;
const MAX_IMAGES = 10;

// Đã chuẩn hóa toàn bộ ảnh về JPG
const EXTENSIONS = ["jpg"];

// Cache danh sách ảnh
const IMAGE_CACHE_KEY = "hienluong_bg_images";
const IMAGE_CACHE_TIME_KEY = "hienluong_bg_images_time";
const IMAGE_CACHE_DURATION = 24 * 60 * 60 * 1000;

//======================================================
// DỮ LIỆU
//======================================================

const IMAGES = [];
let current = 0;
let front = null;
let back = null;
let slideTimer = null;

// Lưu các ảnh đã preload
const PRELOADED_IMAGES = new Map();

//======================================================
// DOM READY
//======================================================

document.addEventListener("DOMContentLoaded",init);

//======================================================
// INIT
//======================================================

async function init() {

    front = document.getElementById("bg1");
    back = document.getElementById("bg2");
    if (!front || !back) {
        console.error("Không tìm thấy bg1/bg2");
        return;
    }

    //==================================================
    // ƯU TIÊN ẢNH ĐẦU TIÊN
    //==================================================

    const firstImage ="store/anh1.jpg";
    const firstOK = await checkImage(firstImage);
    if (firstOK) {
        IMAGES.push(firstImage);
        front.style.backgroundImage ='url("' + firstImage + '")';
        front.classList.add("active");

        //================================================
        // HIỆN ẢNH 1 NGAY
        //================================================
        startSlideshow();

        //================================================
        // TÌM CÁC ẢNH CÒN LẠI Ở NỀN
        //================================================

        buildRemainingImages();
        return;
    }

    //==================================================
    // NẾU ANH1 KHÔNG CÓ
    //==================================================

    await buildImageList();
    if (!IMAGES.length) {
        console.error("Không tìm thấy ảnh slideshow.");
        return;
    }
    front.style.backgroundImage ='url("' + IMAGES[0] + '")';
    front.classList.add("active");
    startSlideshow();
}

//======================================================
// START SLIDESHOW
//======================================================

function startSlideshow() {
    if (slideTimer) {
        clearInterval(slideTimer);
    }

    // Chỉ preload đúng ảnh kế tiếp
    preloadNext();
    slideTimer = setInterval(nextSlide,CHANGE_TIME);
}

//======================================================
// TÌM CÁC ẢNH CÒN LẠI
//======================================================

async function buildRemainingImages() {

    //==================================================
    // KIỂM TRA CACHE
    //==================================================

    const cachedImages = getCachedImages();
    if (
        Array.isArray(cachedImages) &&
        cachedImages.length
    ) {
        const ordered = [];

        // Đảm bảo anh1 đứng đầu
        if (
            cachedImages.includes(
                "store/anh1.jpg"
            )
        ) {

            ordered.push("store/anh1.jpg");
        }

        for (
            const image of cachedImages
        ) {

            if (
                image !== "store/anh1.jpg" &&
                !ordered.includes(image)
            ) {
                ordered.push(image);
            }
        }

        IMAGES.length = 0;
        IMAGES.push(
            ...ordered
        );

                // Chỉ tải ảnh kế tiếp
        preloadNext();
        return;
    }

    //==================================================
    // KHÔNG CÓ CACHE
    // TÌM ẢNH 2 → 10
    //==================================================

    for (
        let i = 2;
        i <= MAX_IMAGES;
        i++
    ) {
        const file ="store/anh" + i + ".jpg";
        const exists = await checkImage(file);
        if (exists) {
            IMAGES.push(file);
        }
        else {
            console.warn("⚠ Không tìm thấy anh" + i);
        }
    }

    //==================================================
    // LƯU CACHE
    //==================================================

    saveImageCache();
    
//==================================================
    // CHỈ PRELOAD ẢNH KẾ TIẾP
    //==================================================

    preloadNext();
}

//======================================================
// BUILD IMAGE LIST
// DÙNG KHI ANH1 KHÔNG TỒN TẠI
//======================================================

async function buildImageList() {

    IMAGES.length = 0;

    //==================================================
    // ĐỌC CACHE
    //==================================================

    const cachedImages = getCachedImages();

    if (
        Array.isArray(cachedImages) &&
        cachedImages.length
    ) {

        IMAGES.push(
            ...cachedImages
        );
          return;
    }

    //==================================================
    // TÌM ẢNH
    //==================================================

    for (
        let i = 1;
        i <= MAX_IMAGES;
        i++
    ) {

        const file = "store/anh" + i + ".jpg";
        const exists = await checkImage(file);
        if (exists) {
            IMAGES.push(file);
        }
        else {
            console.warn("⚠ Không tìm thấy anh" + i);
        }
    }

    //==================================================
    // LƯU CACHE
    //==================================================

    saveImageCache();
}

//======================================================
// LƯU CACHE
//======================================================

function saveImageCache() {

    if (!IMAGES.length) {
        return;
    }
    try {

        localStorage.setItem(IMAGE_CACHE_KEY,JSON.stringify(IMAGES));
        localStorage.setItem(IMAGE_CACHE_TIME_KEY,String(Date.now()));
    }
    catch (error) {
        console.warn("⚠ Không thể lưu cache ảnh:",error);
    }
}

//======================================================
// ĐỌC CACHE
//======================================================

function getCachedImages() {

    try {
        const data = localStorage.getItem(IMAGE_CACHE_KEY);
        const time = localStorage.getItem(IMAGE_CACHE_TIME_KEY);
        if (!data || !time) {
            return null;
        }
        const cacheAge = Date.now() - Number(time);
        if (
            cacheAge >
            IMAGE_CACHE_DURATION
        ) {

            localStorage.removeItem(IMAGE_CACHE_KEY);
            localStorage.removeItem(IMAGE_CACHE_TIME_KEY);
            return null;
        }
        const images =JSON.parse(data);
        if (
            !Array.isArray(images)
        ) {

            return null;
        }
        return images;
    }
    catch (error) {
        console.warn("⚠ Lỗi đọc cache ảnh:",error);
        return null;
    }
}

//======================================================
// KIỂM TRA ẢNH
//======================================================

function checkImage(path) {

    return new Promise(
        function(resolve) {
            const img = new Image();
            img.onload = function() {resolve(true);
                };
            img.onerror =function() {resolve(false);
                };
            img.src = path;
        }
    );
}

//======================================================
// PRELOAD ẢNH
//======================================================

function preloadImage(path) {

    // Nếu ảnh đã preload rồi
    if (
        PRELOADED_IMAGES.has(path)
    ) {
        return PRELOADED_IMAGES.get(path);
    }

    const promise =
        new Promise(
            function(resolve) {
                const img = new Image();
                img.decoding = "async";
                img.onload = function() {resolve(img);
                    };
                img.onerror = function() {PRELOADED_IMAGES.delete(path);
                 resolve(null);
                    };
                img.src = path;
            }
        );

    PRELOADED_IMAGES.set(path,promise);
    return promise;
}

//======================================================
// PRELOAD ẢNH KẾ TIẾP
//======================================================

function preloadNext() {

    if (
        IMAGES.length < 2
    ) {

        return;
    }

    let next = current + 1;

    if (
        next >= IMAGES.length
    ) {

        next = 0;
    }
    const nextSrc = IMAGES[next];
    preloadImage(nextSrc);
}

//======================================================
// NEXT SLIDE
//======================================================

async function nextSlide() {

    if (
        IMAGES.length < 2
    ) {
        return;
    }
    let next = current + 1;
    if (
        next >= IMAGES.length
    ) {

        next = 0;
    }
    const nextSrc = IMAGES[next];

    //==================================================
    // LẤY ẢNH ĐÃ PRELOAD
    //==================================================

    const loadedImage = await preloadImage(nextSrc);
    if (!loadedImage) {
        console.warn("Không tải được:",nextSrc);
        return;
    }

    //==================================================
    // HIỆN ẢNH MỚI
    //==================================================

    back.style.backgroundImage ='url("' + nextSrc + '")';
    back.classList.add("active");
    front.classList.remove("active");

    //==================================================
    // ĐỔI LỚP
    //==================================================

    const temp = front;
    front = back;
    back = temp;
    current = next;

    //==================================================
    // XÓA ẢNH CŨ KHỎI CACHE PRELOAD
    // KHÔNG XÓA ẢNH ĐANG HIỂN THỊ
    //==================================================

    const previousIndex = current - 1 >= 0 ? current - 1 : IMAGES.length - 1;
    const previousSrc = IMAGES[previousIndex];
    if (
        previousSrc !== nextSrc
    ) {

        PRELOADED_IMAGES.delete(
            previousSrc
        );
    }

    //==================================================
    // PRELOAD ẢNH TIẾP THEO
    //==================================================

    preloadNext();
}