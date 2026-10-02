import {readData} from "../../scripts/firebaseService.js";
import {hideMedia} from "../components/floatingmedia.js";

let LIST=[];
let CURRENT=null;
let DATA_LOADED_AT=0;
let DATA_LOADING=null;
const DATA_CACHE_TIME=60000;

async function loadData(force=false){
    const now=Date.now();
    if(!force&&DATA_LOADED_AT&&(now-DATA_LOADED_AT)<DATA_CACHE_TIME)return LIST;
    if(DATA_LOADING)return DATA_LOADING;
    DATA_LOADING=(async()=>{
        try{
            const data=await readData("admin/thongbao");
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
            console.error("❌ LOAD THÔNG BÁO ERROR:",err);
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

export async function getList(){
    await loadData();
    return LIST;
}

export async function renderItem(id){
    await loadData();
    const item=LIST.find(x=>x.id===id);
    if(!item){
        console.warn("⚠️ KHÔNG TÌM THẤY THÔNG BÁO:",id);
        return;
    }
    CURRENT=item;
    renderMain();
}

export async function renderItemInline(id,box){
    await loadData();
    const item=LIST.find(x=>x.id===id);
    if(!item){
        console.warn("⚠️ KHÔNG TÌM THẤY THÔNG BÁO:",id);
        return;
    }

    CURRENT=item;
    hideMedia();

    box.innerHTML=`
        <div class="hl-thongbao-inline-detail">
            <button type="button" class="hl-history-inline-back">← Quay lại danh sách</button>
            <h2 class="hl-thongbao-title">${CURRENT.title||""}</h2>
            ${CURRENT.image?`<div class="hl-thongbao-image"><img src="${CURRENT.image}" alt="${CURRENT.title||"Thông báo"}" decoding="async"></div>`:""}
            ${CURRENT.author?`<div class="hl-thongbao-author"><b>✍ Người thông báo:</b> ${CURRENT.author}</div>`:""}
            ${CURRENT.date?`<div class="hl-thongbao-date"><b>📅 Ngày:</b> ${CURRENT.date}</div>`:""}
            <div class="hl-thongbao-content">${CURRENT.content||""}</div>
        </div>`;

    const backButton=box.querySelector(".hl-history-inline-back");
    if(backButton){
        backButton.addEventListener("click",async function(event){
            event.stopPropagation();
            if(typeof window.loadThongBaoInlineList==="function"){
                await window.loadThongBaoInlineList();
            }
        });
    }
}

export function renderMain(){
    const box=document.getElementById("hl-content");
    if(!box)return;
    const bg=document.getElementById("bg-main");
    if(bg)bg.style.display="none";
    hideMedia();

    if(!CURRENT){
        box.innerHTML=`<div class="hl-empty">Chưa có dữ liệu thông báo.</div>`;
        return;
    }

    box.innerHTML=`
        <div class="hl-thongbao">
            <button type="button" class="hl-history-back" id="hl-thongbao-back">
                ← Quay lại
            </button>
            <h2 class="hl-thongbao-title">${CURRENT.title||""}</h2>
            ${CURRENT.image?`<div class="hl-thongbao-image"><img src="${CURRENT.image}" alt="${CURRENT.title||"Thông báo"}" decoding="async"></div>`:""}
            ${CURRENT.author?`<div class="hl-thongbao-author"><b>✍ Người thông báo:</b> ${CURRENT.author}</div>`:""}
            ${CURRENT.date?`<div class="hl-thongbao-date"><b>📅 Ngày:</b> ${CURRENT.date}</div>`:""}
            <div class="hl-thongbao-content">${CURRENT.content||""}</div>
        </div>`;

    const backButton=document.getElementById("hl-thongbao-back");
    if(backButton){
        backButton.addEventListener("click",()=>{
            hideMedia();
            box.innerHTML="";
            const bg=document.getElementById("bg-main");
            if(bg)bg.style.display="";
            const card=document.getElementById("hl-card-thongbao");
            if(card)card.scrollIntoView({behavior:"smooth",block:"center"});
        });
    }

    requestAnimationFrame(()=>{
        box.scrollIntoView({behavior:"smooth",block:"start"});
    });
}