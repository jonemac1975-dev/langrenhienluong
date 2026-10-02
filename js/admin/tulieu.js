import {readData} from "../../scripts/firebaseService.js";
import {showVideo,hideMedia} from "../components/floatingmedia.js";

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
            const data=await readData("admin/tulieu");
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
            console.error("❌ LOAD TƯ LIỆU ERROR:",err);
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
        console.warn("⚠️ KHÔNG TÌM THẤY TƯ LIỆU:",id);
        return;
    }
    CURRENT=item;
    renderMain();
}


export async function renderItemInline(id,box){
    await loadData();
    const item=LIST.find(x=>x.id===id);
    if(!item){
        console.warn("⚠️ KHÔNG TÌM THẤY TƯ LIỆU:",id);
        return;
    }

    CURRENT=item;
    hideMedia();

    box.innerHTML=`
        <div class="hl-tulieu-inline-detail">
            <button type="button" class="hl-history-inline-back">← Quay lại danh sách</button>
            <h2 class="hl-tulieu-title">${CURRENT.title||""}</h2>
            ${CURRENT.type?`<div class="hl-tulieu-type"><b>📚 Loại tư liệu:</b> ${CURRENT.type}</div>`:""}
            ${CURRENT.image?`<div class="hl-tulieu-image"><img src="${CURRENT.image}" alt="${CURRENT.title||"Tư liệu Hiền Lương"}" decoding="async"></div>`:""}
            ${CURRENT.source?`<div class="hl-tulieu-source"><b>📖 Nguồn:</b> ${CURRENT.source}</div>`:""}
            ${CURRENT.author?`<div class="hl-tulieu-author"><b>✍ Tác giả:</b> ${CURRENT.author}</div>`:""}
            ${CURRENT.link?`<div class="hl-tulieu-link"><a href="#" class="btn-link">🔗 Xem tư liệu</a></div>`:""}
            <div class="hl-tulieu-content">${CURRENT.content||""}</div>
        </div>`;

    const btn=box.querySelector(".btn-link");
    if(btn){
        btn.onclick=function(e){
            e.preventDefault();
            const url=CURRENT.link||"";
            if(url.includes("youtube.com")||url.includes("youtu.be")||url.includes("drive.google.com")){
                showVideo(url);
            }else if(url){
                window.open(url,"_blank","noopener,noreferrer");
            }
        };
    }

    const backButton=box.querySelector(".hl-history-inline-back");
    if(backButton){
        backButton.addEventListener("click",async function(event){
            event.stopPropagation();
            if(typeof window.loadTuLieuInlineList==="function"){
                await window.loadTuLieuInlineList();
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
        box.innerHTML=`<div class="hl-empty">Chưa có dữ liệu tư liệu.</div>`;
        return;
    }

    box.innerHTML=`
        <div class="hl-tulieu">
            <button type="button" class="hl-history-back" id="hl-tulieu-back">
                ← Quay lại
            </button>
            <h2 class="hl-tulieu-title">${CURRENT.title||""}</h2>
            ${CURRENT.type?`<div class="hl-tulieu-type"><b>📚 Loại tư liệu:</b> ${CURRENT.type}</div>`:""}
            ${CURRENT.image?`<div class="hl-tulieu-image"><img src="${CURRENT.image}" alt="${CURRENT.title||"Tư liệu Hiền Lương"}" decoding="async"></div>`:""}
            ${CURRENT.source?`<div class="hl-tulieu-source"><b>📖 Nguồn:</b> ${CURRENT.source}</div>`:""}
            ${CURRENT.author?`<div class="hl-tulieu-author"><b>✍ Tác giả:</b> ${CURRENT.author}</div>`:""}
            ${CURRENT.link?`<div class="hl-tulieu-link"><a href="#" class="btn-link">🔗 Xem tư liệu</a></div>`:""}
            <div class="hl-tulieu-content">${CURRENT.content||""}</div>
        </div>`;

    const btn=box.querySelector(".btn-link");
    if(btn){
        btn.onclick=function(e){
            e.preventDefault();
            const url=CURRENT.link||"";
            if(url.includes("youtube.com")||url.includes("youtu.be")||url.includes("drive.google.com")){
                showVideo(url);
            }else if(url){
                window.open(url,"_blank","noopener,noreferrer");
            }
        };
    }

    const backButton=document.getElementById("hl-tulieu-back");
    if(backButton){
        backButton.addEventListener("click",()=>{
            hideMedia();
            box.innerHTML="";
            const bg=document.getElementById("bg-main");
            if(bg)bg.style.display="";
            const card=document.getElementById("hl-card-tulieu");
            if(card)card.scrollIntoView({behavior:"smooth",block:"center"});
        });
    }

    requestAnimationFrame(()=>{
        box.scrollIntoView({behavior:"smooth",block:"start"});
    });
}