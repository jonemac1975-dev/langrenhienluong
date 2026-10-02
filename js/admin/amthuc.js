//======================================================
// HIENLUONG WEBSITE
// File : /js/admin/amthuc.js
// Tối ưu: cache dữ liệu + chống đọc Firebase dư
//======================================================

import {readData} from "../../scripts/firebaseService.js";
import {showVideo,showMap,hideMedia} from "../components/floatingmedia.js";

//======================================================

let LIST=[];
let CURRENT=null;
let DATA_LOADED_AT=0;
let DATA_LOADING=null;
const DATA_CACHE_TIME=60000;

//======================================================
// LOAD DATA
//======================================================

async function loadData(force=false){
    const now=Date.now();
    if(!force&&DATA_LOADED_AT&&(now-DATA_LOADED_AT)<DATA_CACHE_TIME){
        return LIST;
    }
    if(DATA_LOADING){
        return DATA_LOADING;
    }
    DATA_LOADING=(async()=>{
        try{
            const data=await readData("admin/amthuc");
            if(!data){
                LIST=[];
                CURRENT=null;
                DATA_LOADED_AT=Date.now();
                return LIST;
            }
            LIST=Object.entries(data).map(([id,item])=>({id,...item}));
            LIST.sort((a,b)=>(b.updated_at||0)-(a.updated_at||0));
            CURRENT=LIST[0]||null;
            DATA_LOADED_AT=Date.now();
            return LIST;
        }catch(err){
            console.error("❌ LOAD ẨM THỰC ERROR:",err);
            LIST=[];
            CURRENT=null;
            DATA_LOADED_AT=0;
            return LIST;
        }finally{
            DATA_LOADING=null;
        }
    })();
    return DATA_LOADING;
}

//======================================================
// GET LIST
//======================================================

export async function getList(){
    await loadData();
    return LIST;
}

//======================================================
// RENDER ITEM
//======================================================

export async function renderItem(id){
    await loadData();
    const item=LIST.find(x=>x.id===id);
    if(!item){
        console.warn("⚠️ KHÔNG TÌM THẤY SẢN VẬT:",id);
        return;
    }
    CURRENT=item;
    renderMain();
}

export async function renderItemInline(id,box){
    await loadData();

    const item=LIST.find(x=>x.id===id);
    if(!item){
        console.warn("⚠️ KHÔNG TÌM THẤY SẢN VẬT:",id);
        return;
    }

    CURRENT=item;
    hideMedia();

    box.innerHTML=`
        <div class="hl-amthuc-inline-detail">
            <button type="button" class="hl-history-inline-back">← Quay lại danh sách</button>

            <h2 class="hl-amthuc-title">${CURRENT.name||""}</h2>

            ${CURRENT.image?`
                <div class="hl-amthuc-image">
                    <img src="${CURRENT.image}" alt="${CURRENT.name||"Sản vật Hiền Lương"}" decoding="async">
                </div>
            `:""}

            ${CURRENT.address?`
                <div class="hl-amthuc-address">
                    <b>📍 Địa chỉ:</b>
                    ${CURRENT.address}
                </div>
            `:""}

            ${CURRENT.map?`
                <div class="hl-amthuc-map">
                    <a href="#" class="btn-map">🗺 Xem Google Maps</a>
                </div>
            `:""}

            ${CURRENT.video?`
                <div class="hl-amthuc-video">
                    <a href="#" class="btn-video">🎬 Xem Video</a>
                </div>
            `:""}

            <div class="hl-amthuc-content">
                ${CURRENT.content||""}
            </div>
        </div>
    `;

    const btnVideo=box.querySelector(".btn-video");
    if(btnVideo){
        btnVideo.onclick=function(e){
            e.preventDefault();
            showVideo(CURRENT.video);
        };
    }

    const btnMap=box.querySelector(".btn-map");
    if(btnMap){
        btnMap.onclick=function(e){
            e.preventDefault();
            showMap(CURRENT.map);
        };
    }

    const backButton=box.querySelector(".hl-history-inline-back");
    if(backButton){
        backButton.addEventListener("click",async function(event){
            event.stopPropagation();
            if(typeof window.loadAmThucInlineList==="function"){
                await window.loadAmThucInlineList();
            }
        });
    }
}
//======================================================
// RENDER MAIN
//======================================================

export function renderMain(){
    const box=document.getElementById("hl-content");
    if(!box)return;

    const bg=document.getElementById("bg-main");
    if(bg)bg.style.display="none";

    hideMedia();

    if(!CURRENT){
        box.innerHTML=`<div class="hl-empty">Chưa có dữ liệu sản vật làng nghề.</div>`;
        return;
    }

    box.innerHTML=`
        <div class="hl-amthuc">
            <button type="button" class="hl-history-back" id="hl-amthuc-back">
                ← Quay lại
            </button>

            <h2 class="hl-amthuc-title">
                ${CURRENT.name||""}
            </h2>

            ${
                CURRENT.image
                ?
                `
                <div class="hl-amthuc-image">
                    <img
                        src="${CURRENT.image}"
                        alt="${CURRENT.name||"Sản vật Hiền Lương"}"
                        decoding="async"
                    >
                </div>
                `
                :
                ""
            }

            ${
                CURRENT.address
                ?
                `
                <div class="hl-amthuc-address">
                    <b>📍 Địa chỉ:</b>
                    ${CURRENT.address}
                </div>
                `
                :
                ""
            }

            ${
                CURRENT.map
                ?
                `
                <div class="hl-amthuc-map">
                    <a href="#" class="btn-map">
                        🗺 Xem Google Maps
                    </a>
                </div>
                `
                :
                ""
            }

            ${
                CURRENT.video
                ?
                `
                <div class="hl-amthuc-video">
                    <a href="#" class="btn-video">
                        🎬 Xem Video
                    </a>
                </div>
                `
                :
                ""
            }

            <div class="hl-amthuc-content">
                ${CURRENT.content||""}
            </div>
        </div>
    `;

    const btnVideo=box.querySelector(".btn-video");
    if(btnVideo){
        btnVideo.onclick=function(e){
            e.preventDefault();
            showVideo(CURRENT.video);
        };
    }

    const btnMap=box.querySelector(".btn-map");
    if(btnMap){
        btnMap.onclick=function(e){
            e.preventDefault();
            showMap(CURRENT.map);
        };
    }

    const backButton=document.getElementById("hl-amthuc-back");
    
   if(backButton){
        backButton.addEventListener("click",()=>{
            hideMedia();
            box.innerHTML="";
            const bg=document.getElementById("bg-main");
            if(bg)bg.style.display="";
            const card=document.getElementById("hl-card-amthuc");
            if(card)card.scrollIntoView({behavior:"smooth",block:"center"});
                   });
    }

    requestAnimationFrame(()=>{
        box.scrollIntoView({
            behavior:"smooth",
            block:"start"
        });
    });
}