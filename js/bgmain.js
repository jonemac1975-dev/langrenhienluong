//======================================================
// HIENLUONG WEBSITE
// File : bgmain.js
//======================================================
//======================================================
// CẤU HÌNH
//======================================================

const CHANGE_TIME = 7000;

const MAX_IMAGES = 10;

const EXTENSIONS = [

    "jpg",
    "jpeg",
    "png",
    "webp"

];

//======================================================

const IMAGES = [];

let current = 0;

let front;
let back;

//======================================================

document.addEventListener(
    "DOMContentLoaded",
    init
);

//======================================================

async function init(){

    front = document.getElementById("bg1");

    back = document.getElementById("bg2");

    if(!front || !back){

        console.error(
            "Không tìm thấy bg1/bg2"
        );

        return;

    }

    await buildImageList();

    if(IMAGES.length===0){

        console.error(
            "Không tìm thấy ảnh slideshow."
        );

        return;

    }

    front.style.backgroundImage =
        `url("${IMAGES[0]}")`;

    front.classList.add("active");

    preloadImages();

    setInterval(

        nextSlide,

        CHANGE_TIME

    );

}

//======================================================
// TỰ TÌM ĐÚNG FILE ẢNH
//======================================================

async function buildImageList(){

    IMAGES.length = 0;

    for(

        let i=1;

        i<=MAX_IMAGES;

        i++

    ){

        const file = await findImage(i);

        if(file){

            IMAGES.push(file);

        }
        else{

            console.warn(

                `⚠ Không tìm thấy anh${i}`

            );

        }

    }

    

}

//======================================================

async function findImage(index){

    for(

        const ext

        of EXTENSIONS

    ){

        const path =

            `store/anh${index}.${ext}`;

        try{

            const res = await fetch(

                path,

                {

                    method:"HEAD",

                    cache:"no-cache"

                }

            );

            if(res.ok){

                return path;

            }

        }

        catch(err){

        }

    }

    return null;

}

//======================================================

function preloadImages(){

    IMAGES.forEach(src=>{

        const img = new Image();

        img.src = src;

    });

}

//======================================================

function nextSlide(){

    let next = current + 1;

    if(next >= IMAGES.length){

        next = 0;

    }

    const img = new Image();

    img.onload = ()=>{

        back.style.backgroundImage =

            `url("${IMAGES[next]}")`;

        back.classList.add("active");

        front.classList.remove("active");

        const temp = front;

        front = back;

        back = temp;

        current = next;

    };

    img.onerror = ()=>{

        console.warn(

            "Không tải được:",

            IMAGES[next]

        );

        current = next;

    };

    img.src = IMAGES[next];

}