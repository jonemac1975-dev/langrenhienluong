import {readData} from "../../scripts/firebaseService.js";
import {showMap,hideMedia} from "../components/floatingmedia.js";

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
            const data=await readData("admin/hotoc");
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
            console.error("❌ LOAD HỌ TỘC ERROR:",err);
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
        console.warn("⚠️ KHÔNG TÌM THẤY HỌ TỘC:",id);
        return;
    }
    CURRENT=item;
    renderMain();
}


export async function renderItemInline(id,box){
    await loadData();
    const item=LIST.find(x=>x.id===id);
    if(!item){
        console.warn("⚠️ KHÔNG TÌM THẤY HỌ TỘC:",id);
        return;
    }

    CURRENT=item;
    hideMedia();

    box.innerHTML=`
        <div class="hl-hotoc-inline-detail">
            <button type="button" class="hl-history-inline-back">← Quay lại danh sách</button>
            <h2 class="hl-hotoc-title">${CURRENT.name||""}</h2>
            ${CURRENT.image?`<div class="hl-hotoc-image"><img src="${CURRENT.image}" alt="${CURRENT.name||"Họ tộc Hiền Lương"}" decoding="async"></div>`:""}
            ${CURRENT.web?`<div class="hl-hotoc-web"><b>🌐 Website gia phả:</b><a href="${CURRENT.web}" target="_blank" rel="noopener noreferrer">Xem Website</a></div>`:""}
            ${CURRENT.map?`<div class="hl-hotoc-map"><a href="#" class="btn-map">🗺 Xem Google Maps</a></div>`:""}
            <div class="hl-hotoc-content">${CURRENT.content||""}</div>
        </div>`;

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
            if(typeof window.loadHoTocInlineList==="function"){
                await window.loadHoTocInlineList();
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
        box.innerHTML=`<div class="hl-empty">Chưa có dữ liệu họ tộc.</div>`;
        return;
    }

    box.innerHTML=`
        <div class="hl-hotoc">
            <button type="button" class="hl-history-back" id="hl-hotoc-back">
                ← Quay lại
            </button>
            <h2 class="hl-hotoc-title">${CURRENT.name||""}</h2>
            ${CURRENT.image?`<div class="hl-hotoc-image"><img src="${CURRENT.image}" alt="${CURRENT.name||"Họ tộc Hiền Lương"}" decoding="async"></div>`:""}
            ${CURRENT.web?`<div class="hl-hotoc-web"><b>🌐 Website gia phả:</b><a href="${CURRENT.web}" target="_blank" rel="noopener noreferrer">Xem Website</a></div>`:""}
            ${CURRENT.map?`<div class="hl-hotoc-map"><a href="#" class="btn-map">🗺 Xem Google Maps</a></div>`:""}
            <div class="hl-hotoc-content">${CURRENT.content||""}</div>
        </div>`;

    const btnMap=box.querySelector(".btn-map");
    if(btnMap){
        btnMap.onclick=function(e){
            e.preventDefault();
            showMap(CURRENT.map);
        };
    }

    const backButton=document.getElementById("hl-hotoc-back");
    if(backButton){
        backButton.addEventListener("click",()=>{
            hideMedia();
            box.innerHTML="";
            const bg=document.getElementById("bg-main");
            if(bg)bg.style.display="";
            const card=document.getElementById("hl-card-hotoc");
            if(card)card.scrollIntoView({behavior:"smooth",block:"center"});
        });
    }

    requestAnimationFrame(()=>{
        box.scrollIntoView({behavior:"smooth",block:"start"});
    });
}