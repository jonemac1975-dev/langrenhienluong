
import "./bgmain.js";
import {getLanguage,t} from "./language.js";

//======================================================
// MODULE PATH
//======================================================

const MODULE_PATH = {

    // LEFT
    gioithieu: "./admin/gioithieu.js",
    lichsu: "./admin/lichsu.js",
    danhnhan: "./admin/danhnhan.js",
    danhthang: "./admin/danhthang.js",
    amthuc: "./admin/amthuc.js",
    diadanh: "./admin/diadanh.js",
    hotoc: "./admin/hotoc.js",
    tulieu: "./admin/tulieu.js",
    thongbao: "./admin/thongbao.js",
    hangkinh: "./hangkinh/hangkinh.js",
    nhac:"../admin/js/nhac.js",

    // RIGHT
    chuyenhangngay: "./customers/chuyenhangngay.js",
    baiviet: "./customers/baiviet.js",
    thanhvien: "./customers/thanhvien.js",
    taichinh: "./customers/taichinh.js"
};

//======================================================
// MODULE CACHE
//======================================================

const MODULE_CACHE = new Map();
let CURRENT_PAGE = "";

//======================================================
// DOM READY
//======================================================

document.addEventListener("DOMContentLoaded",init);

async function init(){
    bindMenu();
    bindNewNavigation();
    updateThongBaoBadge();
    const hangKinhSection=document.getElementById("hl-hangkinh-section");
    if(hangKinhSection){
        const observer=new IntersectionObserver(entries=>{
            if(entries[0].isIntersecting){
                observer.disconnect();
                loadHangKinhList();
            }
        },{rootMargin:"300px"});
        observer.observe(hangKinhSection);
    }
    await updateChuyenHangNgayBadgeOnStart();
    bindMobileToggle();
    initWelcome();


    //==================================================
    // THUMBNAIL TĨNH - THÀNH VIÊN
    // Không cần import thanhvien.js.
    // Không đọc Firebase.
    // Chỉ hiển thị chữ cố định cho ô menu.
    //==================================================

    const thanhVienMenus = document.querySelectorAll('.hl-menu[data-page="thanhvien"]');
    thanhVienMenus.forEach(
        function(menu) {
            const thumb = menu.querySelector(".hl-thumb");
            if(!thumb) {
                return;
            }
 //           thumb.innerHTML =`<div class="tv-thumb-text">👥 DS thành viên </div>`;
        }
    );
		loadVinhDanhTienHien();
}

//======================================================
// WELCOME
//======================================================

function initWelcome(){
    const overlay = document.getElementById("hl-welcome-overlay");
    if(!overlay)return;

    if(sessionStorage.getItem("hl_welcome_shown") === "1"){
        overlay.style.display = "none";
        return;
    }

    	overlay.style.display = "flex";
	const exitButton = document.getElementById("hl-welcome-exit");
	exitButton?.addEventListener("click",()=>{
	sessionStorage.setItem("hl_welcome_shown","1");
    	overlay.style.display="none";
});

	const agreeButton = document.getElementById("hl-welcome-agree");
	agreeButton?.addEventListener("click",async()=>{
    	sessionStorage.setItem("hl_welcome_shown","1");
    	agreeButton.disabled=true;
    	agreeButton.textContent="⏳ Đang tải...";
    	await loadWelcomeMusic();
});

	const footerPlay=document.getElementById("hl-footer-play");
	footerPlay?.addEventListener("click",()=>{
    	const overlay=document.getElementById("hl-welcome-overlay");
    	const list=document.getElementById("hl-welcome-music-list");
    	if(!list||!list.querySelector("iframe"))return;
    	overlay.style.display="flex";
    	list.style.display="block";
});

	const mobileMusic=document.getElementById("mobile-bottom-music");
	mobileMusic?.addEventListener("click",()=>{
   	const overlay=document.getElementById("hl-welcome-overlay");
    	const list=document.getElementById("hl-welcome-music-list");
    	if(!list||!list.querySelector("iframe"))return;
    	overlay.style.display="flex";
    	list.style.display="block";
});

	const stopButton=document.getElementById("hl-welcome-stop");
	stopButton?.addEventListener("click",()=>{
    	const overlay=document.getElementById("hl-welcome-overlay");
    	const list=document.getElementById("hl-welcome-music-list");
    	const footerTitle=document.getElementById("hl-footer-music-title");
    	const footerPlay=document.getElementById("hl-footer-play");
    	const mobileMusic=document.getElementById("mobile-bottom-music");
    if(list)list.innerHTML="";
    if(stopButton)stopButton.style.display="none";
    if(overlay)overlay.style.display="none";
    if(footerTitle)footerTitle.textContent="Chưa chọn bài";
    if(footerPlay)footerPlay.textContent="🎵 Nhạc";
    if(mobileMusic)mobileMusic.innerHTML="<span>🎵</span><span>Nhạc</span>";
});
}

//======================================================
// WELCOME MUSIC
//======================================================

async function loadWelcomeMusic(){
    const list=document.getElementById("hl-welcome-music-list");
    if(!list)return;

    try{
        const {readData}=await import("../scripts/firebaseService.js");
        const data=await readData("admin/nhac");
        const items=Object.entries(data||{}).filter(([id,item])=>item&&item.active===true);

        if(!items.length){
            list.innerHTML="<div style=\"text-align:center;padding:20px;\">Hiện chưa có bản nhạc nào.</div>";
            list.style.display="block";
            return;
        }

        list.innerHTML=items.map(([id,item])=>`
            <div class="hl-welcome-music-item" data-id="${id}">
                ${item.image_url?`<img src="${item.image_url}" alt="">`:""}
                <div>
                    <div class="hl-welcome-music-title">${item.title||"Không tên"}</div>
                    <div class="hl-welcome-music-type">${item.type||"Nhạc"}</div>
                </div>
            </div>
        `).join("");

        list.style.display="block";
	list.querySelectorAll(".hl-welcome-music-item").forEach(item=>{
    item.addEventListener("click",()=>{
    const id=item.dataset.id;
    const music=items.find(([musicId])=>musicId===id)?.[1];
    if(!music)return;
    
    if(music.media_type==="youtube"&&music.link){
        const match=music.link.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
        const videoId=match?.[1];
        if(!videoId){
            console.warn("⚠️ KHÔNG LẤY ĐƯỢC YOUTUBE ID:",music.link);
            return;
        }

        const player=document.createElement("iframe");
        player.src=`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
        player.width="100%";
        player.height="315";
        player.allow="autoplay; encrypted-media";
        player.allowFullscreen=true;
        player.style.border="0";
        player.style.borderRadius="12px";

        list.innerHTML="";
        list.appendChild(player);
	const stopButton=document.getElementById("hl-welcome-stop");
	if(stopButton)stopButton.style.display="block";
	const footerTitle=document.getElementById("hl-footer-music-title");
	if(footerTitle)footerTitle.textContent=music.title||"Đang phát nhạc";

	const footerPlay=document.getElementById("hl-footer-play");
	if(footerPlay)footerPlay.innerHTML='<span class="hl-coffee"><span class="hl-coffee-cup"></span><span class="hl-coffee-smoke"></span></span><span>🎵 Đang phát</span>';
	const mobileMusic=document.getElementById("mobile-bottom-music");
	if(mobileMusic)mobileMusic.innerHTML='<span class="hl-coffee"><span class="hl-coffee-cup"></span><span class="hl-coffee-smoke"></span></span><span>Đang phát</span>';
    	}
	});
	});
}
      catch(error){
        console.error("❌ WELCOME MUSIC ERROR:",error);
        list.innerHTML="<div style=\"text-align:center;padding:20px;\">Không thể tải danh sách nhạc.</div>";
        list.style.display="block";

    }
}
//======================================================
// LOAD MODULE
//======================================================

async function loadModule(page) {
    const file = MODULE_PATH[page];
    if (!file) {
        console.warn("⚠️ KHÔNG TÌM THẤY MODULE:",page);
        return null;
    }

    //==================================================
    // MODULE ĐÃ LOAD → CACHE
    //==================================================

    if (
        MODULE_CACHE.has(page)
    ) {
         return MODULE_CACHE.get(page);
    }

    //==================================================
    // IMPORT ĐÚNG MODULE ĐƯỢC CLICK
    //==================================================

    try {
        const module = await import(file);
        MODULE_CACHE.set(page, module);
        return module;
    }
    catch(error) {
        console.error("❌ MODULE LOAD ERROR:", page, error);
        throw error;
    }
}

let activeQueHuongPanel=null;
async function loadHistoryCard(){
    	const card=document.getElementById("hl-card-lichsu");
	const cardRow=card?.closest(".hl-card-row");
	if(!card||!cardRow)return;

    	if(activeQueHuongPanel){
        activeQueHuongPanel.remove();
        activeQueHuongPanel=null;
    }

    const panel=document.createElement("div");
    panel.className="hl-quehuong-inline-panel";
    panel.innerHTML=`
        <div class="hl-quehuong-inline-header">
            <div>
                <span class="hl-quehuong-inline-label">LỊCH SỬ - TẾ TỰ</span>
                <h3>Lịch sử/Tế tự Hiền Lương</h3>
            </div>
            <button type="button" class="hl-quehuong-inline-close">×</button>
        </div>
        <div class="hl-quehuong-inline-activities">
            <div class="hl-card-list-loading">⏳ Đang tải danh sách...</div>
        </div>
    `;

    	cardRow.insertAdjacentElement("afterend",panel);
	activeQueHuongPanel=panel;
	panel.scrollIntoView({behavior:"smooth",block:"nearest"});


    	const list=panel.querySelector(".hl-quehuong-inline-activities");
   	const closeButton=panel.querySelector(".hl-quehuong-inline-close");
	window.loadHistoryInlineList=async function(){
    	const module=await loadModule("lichsu");
    	if(!module||typeof module.getList!=="function")return;
    	const items=await module.getList();

    	list.innerHTML=items.map(item=>`
        <button type="button" class="hl-quehuong-inline-item" data-history-id="${item.id}">
            <span class="hl-quehuong-inline-year">${item.year||""}</span>
            <span class="hl-quehuong-inline-title">${item.title||"Không có tiêu đề"}</span>
            <span class="hl-quehuong-inline-arrow">→</span>
        </button>
    `).join("");

    list.querySelectorAll(".hl-quehuong-inline-item").forEach(item=>{
        item.addEventListener("click",async function(event){
            event.stopPropagation();
            const id=this.dataset.historyId;
            if(!id)return;
            await module.renderItemInline(id,list);
        });
    });
};

    closeButton.addEventListener("click",function(){
        panel.remove();
        if(activeQueHuongPanel===panel)activeQueHuongPanel=null;
    });

    try{
        const module=await loadModule("lichsu");
        if(!module||typeof module.getList!=="function"){
            list.innerHTML='<div class="hl-card-list-empty">Chưa có dữ liệu lịch sử.</div>';
            return;
        }

        const items=await module.getList();

        const thumb=card.querySelector(".hl-thumb");
        if(thumb){
            thumb.innerHTML="";
            const latest=items?.[0];
            if(latest?.image){
                const img=document.createElement("img");
                img.src=latest.image;
                img.alt=latest.title||"Lịch sử Hiền Lương";
                img.loading="lazy";
                img.decoding="async";
                thumb.appendChild(img);
            }
        }

        if(!items||!items.length){
            list.innerHTML='<div class="hl-card-list-empty">Chưa có dữ liệu lịch sử.</div>';
            return;
        }

        list.innerHTML=items.map(item=>`
            <button type="button" class="hl-quehuong-inline-item" data-history-id="${item.id}">
                <span class="hl-quehuong-inline-year">${item.year||""}</span>
                <span class="hl-quehuong-inline-title">${item.title||"Không có tiêu đề"}</span>
                <span class="hl-quehuong-inline-arrow">→</span>
            </button>
        `).join("");

        list.querySelectorAll(".hl-quehuong-inline-item").forEach(item=>{
            item.addEventListener("click",async function(event){
                event.stopPropagation();

                const id=this.dataset.historyId;
                if(!id)return;

                if(typeof module.renderItem!=="function"){
                    console.warn("⚠️ LỊCH SỬ CHƯA CÓ renderItem()");
                    return;
                }

                await module.renderItemInline(id,list);
            });
        });

    }catch(error){
        console.error("❌ HISTORY INLINE ERROR:",error);
        list.innerHTML='<div class="hl-card-list-empty">Không thể tải danh sách lịch sử.</div>';
    }
}

async function loadDanhNhanCard(){
    const card=document.getElementById("hl-card-danhnhan");
    const cardRow=card?.closest(".hl-card-row");
    if(!card||!cardRow)return;

    if(activeQueHuongPanel){
        activeQueHuongPanel.remove();
        activeQueHuongPanel=null;
    }

    const panel=document.createElement("div");
    panel.className="hl-quehuong-inline-panel";
    panel.innerHTML=`
        <div class="hl-quehuong-inline-header">
            <div>
                <span class="hl-quehuong-inline-label">DANH NHÂN</span>
                <h3>Danh nhân Hiền Lương</h3>
            </div>
            <button type="button" class="hl-quehuong-inline-close">×</button>
        </div>
        <div class="hl-quehuong-inline-activities">
            <div class="hl-card-list-loading">⏳ Đang tải danh sách...</div>
        </div>
    `;

    cardRow.insertAdjacentElement("afterend",panel);
    activeQueHuongPanel=panel;
    panel.scrollIntoView({behavior:"smooth",block:"nearest"});

    const list=panel.querySelector(".hl-quehuong-inline-activities");
    const closeButton=panel.querySelector(".hl-quehuong-inline-close");

    closeButton.addEventListener("click",function(){
        panel.remove();
        if(activeQueHuongPanel===panel)activeQueHuongPanel=null;
    });

    const renderList=async function(){
        const module=await loadModule("danhnhan");
        if(!module||typeof module.getList!=="function"){
            list.innerHTML='<div class="hl-card-list-empty">Chưa có dữ liệu danh nhân.</div>';
            return;
        }

        const items=await module.getList();
        if(!items||!items.length){
            list.innerHTML='<div class="hl-card-list-empty">Chưa có dữ liệu danh nhân.</div>';
            return;
        }

        const thumb=card.querySelector(".hl-thumb");
        if(thumb){
            const latest=items[0];
            if(latest?.image){
                thumb.innerHTML="";
                const img=document.createElement("img");
                img.src=latest.image;
                img.alt=latest.name||"Danh Nhân Hiền Lương";
                img.loading="lazy";
                img.decoding="async";
                thumb.appendChild(img);
            }
        }

        const tienHien=items.filter(item=>item.tienhien===true);
        const danhNhan=items.filter(item=>item.tienhien!==true);

        const renderItems=function(data){
            return data.map(item=>`
                <button type="button" class="hl-quehuong-inline-item" data-danhnhan-id="${item.id}">
                    <span class="hl-quehuong-inline-year">👤</span>
                    <span class="hl-quehuong-inline-title">${item.name||"Không có tên"}</span>
                    <span class="hl-quehuong-inline-arrow">→</span>
                </button>
            `).join("");
        };

        let html="";

        if(tienHien.length){
            html+=`
                <div class="hl-danhnhan-group">
                    <div class="hl-danhnhan-group-title">TIỀN HIỀN THỦY TỔ</div>
                    <div class="hl-danhnhan-group-list">
                        ${renderItems(tienHien)}
                    </div>
                </div>
            `;
        }

        if(danhNhan.length){
            html+=`
                <div class="hl-danhnhan-group">
                    <div class="hl-danhnhan-group-title">DANH NHÂN</div>
                    <div class="hl-danhnhan-group-list">
                        ${renderItems(danhNhan)}
                    </div>
                </div>
            `;
        }

        list.innerHTML=html||'<div class="hl-card-list-empty">Chưa có dữ liệu danh nhân.</div>';

        list.querySelectorAll(".hl-quehuong-inline-item").forEach(item=>{
            item.addEventListener("click",async function(event){
                event.stopPropagation();
                const id=this.dataset.danhnhanId;
                if(!id)return;

                const module=await loadModule("danhnhan");
                if(!module||typeof module.renderItemInline!=="function"){
                    console.warn("⚠️ DANH NHÂN CHƯA CÓ renderItemInline()");
                    return;
                }

                await module.renderItemInline(id,list);
            });
        });
    };

    window.loadDanhNhanInlineList=renderList;
    await renderList();
}

async function loadVinhDanhTienHien(){
    const list=document.querySelector(".hl-vinhdanh-list");
    if(!list)return;

    list.innerHTML='<div class="hl-vinhdanh-loading">⏳ Đang tải danh sách Tiền Hiền...</div>';

    try{
        const module=await loadModule("danhnhan");
        if(!module||typeof module.getList!=="function"){
            list.innerHTML='<div class="hl-vinhdanh-loading">Chưa có dữ liệu Tiền Hiền.</div>';
            return;
        }

        const items=await module.getList();
        const tienHien=items.filter(item=>item.tienhien===true);

        if(!tienHien.length){
            list.innerHTML='<div class="hl-vinhdanh-loading">Chưa có dữ liệu Tiền Hiền.</div>';
            return;
        }

        list.innerHTML=tienHien.map((item,index)=>`
            <button type="button" class="hl-vinhdanh-item" data-danhnhan-id="${item.id}">
                <span>${String(index+1).padStart(2,"0")}</span>
                <strong>${item.name||"Không có tên"}</strong>
            </button>
        `).join("");
    }catch(error){
        console.error("❌ LOAD VINH DANH TIỀN HIỀN ERROR:",error);
        list.innerHTML='<div class="hl-vinhdanh-loading">Không thể tải danh sách Tiền Hiền.</div>';
    }
}

async function loadDanhThangCard(){
    const card=document.getElementById("hl-card-danhthang");
    const cardRow=card?.closest(".hl-card-row");
    if(!card||!cardRow)return;

    if(activeQueHuongPanel){
        activeQueHuongPanel.remove();
        activeQueHuongPanel=null;
    }

    const panel=document.createElement("div");
    panel.className="hl-quehuong-inline-panel";
    panel.innerHTML=`
        <div class="hl-quehuong-inline-header">
            <div>
                <span class="hl-quehuong-inline-label">ĐIỂM DU LỊCH</span>
                <h3>Danh thắng Hiền Lương</h3>
            </div>
            <button type="button" class="hl-quehuong-inline-close">×</button>
        </div>
        <div class="hl-quehuong-inline-activities">
            <div class="hl-card-list-loading">⏳ Đang tải danh sách...</div>
        </div>
    `;

    cardRow.insertAdjacentElement("afterend",panel);
    activeQueHuongPanel=panel;
    panel.scrollIntoView({behavior:"smooth",block:"nearest"});

    const list=panel.querySelector(".hl-quehuong-inline-activities");
    const closeButton=panel.querySelector(".hl-quehuong-inline-close");

    closeButton.addEventListener("click",function(){
        panel.remove();
        if(activeQueHuongPanel===panel)activeQueHuongPanel=null;
    });

    const renderList=async function(){
        const module=await loadModule("danhthang");
        if(!module||typeof module.getList!=="function"){
            list.innerHTML='<div class="hl-card-list-empty">Chưa có dữ liệu điểm du lịch.</div>';
            return;
        }

        const items=await module.getList();
        if(!items||!items.length){
            list.innerHTML='<div class="hl-card-list-empty">Chưa có dữ liệu điểm du lịch.</div>';
            return;
        }

        const thumb=card.querySelector(".hl-thumb");
        if(thumb){
            const latest=items[0];
            if(latest?.image){
                thumb.innerHTML="";
                const img=document.createElement("img");
                img.src=latest.image;
                img.alt=latest.name||"Điểm du lịch Hiền Lương";
                img.loading="lazy";
                img.decoding="async";
                thumb.appendChild(img);
            }
        }

        list.innerHTML=items.map(item=>`
            <button type="button" class="hl-quehuong-inline-item" data-danhthang-id="${item.id}">
                <span class="hl-quehuong-inline-year">🏞</span>
                <span class="hl-quehuong-inline-title">${item.name||"Không có tên"}</span>
                <span class="hl-quehuong-inline-arrow">→</span>
            </button>
        `).join("");

        list.querySelectorAll(".hl-quehuong-inline-item").forEach(item=>{
            item.addEventListener("click",async function(event){
                event.stopPropagation();
                const id=this.dataset.danhthangId;
                if(!id)return;

                const module=await loadModule("danhthang");
                if(!module||typeof module.renderItemInline!=="function"){
                    console.warn("⚠️ DANH THẮNG CHƯA CÓ renderItemInline()");
                    return;
                }

                await module.renderItemInline(id,list);
            });
        });
    };

    window.loadDanhThangInlineList=renderList;
    await renderList();
}

async function loadAmThucCard(){
    const card=document.getElementById("hl-card-amthuc");
    const cardRow=card?.closest(".hl-card-row");
    if(!card||!cardRow)return;

    if(activeQueHuongPanel){
        activeQueHuongPanel.remove();
        activeQueHuongPanel=null;
    }

    const panel=document.createElement("div");
    panel.className="hl-quehuong-inline-panel";
    panel.innerHTML=`
        <div class="hl-quehuong-inline-header">
            <div>
                <span class="hl-quehuong-inline-label">SẢN VẬT LÀNG NGHỀ</span>
                
            </div>
            <button type="button" class="hl-quehuong-inline-close">×</button>
        </div>
        <div class="hl-quehuong-inline-activities">
            <div class="hl-card-list-loading">⏳ Đang tải danh sách...</div>
        </div>
    `;

    cardRow.insertAdjacentElement("afterend",panel);
    activeQueHuongPanel=panel;
    panel.scrollIntoView({behavior:"smooth",block:"nearest"});

    const listBox=panel.querySelector(".hl-quehuong-inline-activities");
    const closeButton=panel.querySelector(".hl-quehuong-inline-close");

    closeButton.addEventListener("click",function(){
        panel.remove();
        if(activeQueHuongPanel===panel)activeQueHuongPanel=null;
    });

    const renderList=async function(){
        const module=await loadModule("amthuc");
        if(!module||typeof module.getList!=="function"){
            listBox.innerHTML='<div class="hl-card-list-empty">Chưa có dữ liệu.</div>';
            return;
        }

        const list=await module.getList();
        if(!list||!list.length){
            listBox.innerHTML='<div class="hl-card-list-empty">Chưa có dữ liệu.</div>';
            return;
        }

        const thumb=card.querySelector(".hl-thumb");
        if(thumb&&list[0].image){
            thumb.innerHTML=`<img src="${list[0].image}" alt="Sản vật làng nghề Hiền Lương" loading="lazy" decoding="async">`;
        }

        listBox.innerHTML=list.map(item=>`
            <button type="button" class="hl-quehuong-inline-item" data-amthuc-id="${item.id}">
                <span class="hl-quehuong-inline-year">🍲</span>
                <span class="hl-quehuong-inline-title">${item.name||"Chưa có tên"}</span>
                <span class="hl-quehuong-inline-arrow">→</span>
            </button>
        `).join("");

        listBox.querySelectorAll(".hl-quehuong-inline-item").forEach(item=>{
            item.addEventListener("click",async function(event){
                event.stopPropagation();
                const id=this.dataset.amthucId;
                if(!id)return;

                const module=await loadModule("amthuc");
                if(!module||typeof module.renderItemInline!=="function"){
                    console.warn("⚠️ ẨM THỰC CHƯA CÓ renderItemInline()");
                    return;
                }

                await module.renderItemInline(id,listBox);
            });
        });
    };

    window.loadAmThucInlineList=renderList;
    await renderList();
}

async function loadDiaDanhCard(){
    const card=document.getElementById("hl-card-diadanh");
    const cardRow=card?.closest(".hl-card-row");
    if(!card||!cardRow)return;

    if(activeQueHuongPanel){
        activeQueHuongPanel.remove();
        activeQueHuongPanel=null;
    }

    const panel=document.createElement("div");
    panel.className="hl-quehuong-inline-panel";
    panel.innerHTML=`
        <div class="hl-quehuong-inline-header">
            <div>
                <span class="hl-quehuong-inline-label">ĐỊA DANH</span>
                <h3>Địa danh lịch sử Hiền Lương</h3>
            </div>
            <button type="button" class="hl-quehuong-inline-close">×</button>
        </div>
        <div class="hl-quehuong-inline-activities">
            <div class="hl-card-list-loading">⏳ Đang tải danh sách...</div>
        </div>
    `;

    cardRow.insertAdjacentElement("afterend",panel);
    activeQueHuongPanel=panel;
    panel.scrollIntoView({behavior:"smooth",block:"nearest"});

    const listBox=panel.querySelector(".hl-quehuong-inline-activities");
    const closeButton=panel.querySelector(".hl-quehuong-inline-close");

    closeButton.addEventListener("click",function(){
        panel.remove();
        if(activeQueHuongPanel===panel)activeQueHuongPanel=null;
    });

    const renderList=async function(){
        const module=await loadModule("diadanh");
        if(!module||typeof module.getList!=="function"){
            listBox.innerHTML='<div class="hl-card-list-empty">Chưa có dữ liệu.</div>';
            return;
        }

        const list=await module.getList();
        if(!list||!list.length){
            listBox.innerHTML='<div class="hl-card-list-empty">Chưa có dữ liệu.</div>';
            return;
        }

        const thumb=card.querySelector(".hl-thumb");
        if(thumb&&list[0].image){
            thumb.innerHTML=`<img src="${list[0].image}" alt="Địa danh lịch sử Hiền Lương" loading="lazy" decoding="async">`;
        }

        listBox.innerHTML=list.map(item=>`
            <button type="button" class="hl-quehuong-inline-item" data-diadanh-id="${item.id}">
                <span class="hl-quehuong-inline-year">📍</span>
                <span class="hl-quehuong-inline-title">${item.name||"Chưa có tên"}</span>
                <span class="hl-quehuong-inline-arrow">→</span>
            </button>
        `).join("");

        listBox.querySelectorAll(".hl-quehuong-inline-item").forEach(item=>{
            item.addEventListener("click",async function(event){
                event.stopPropagation();
                const id=this.dataset.diadanhId;
                if(!id)return;

                const module=await loadModule("diadanh");
                if(!module||typeof module.renderItemInline!=="function"){
                    console.warn("⚠️ ĐỊA DANH CHƯA CÓ renderItemInline()");
                    return;
                }

                await module.renderItemInline(id,listBox);
            });
        });
    };

    window.loadDiaDanhInlineList=renderList;
    await renderList();
}

async function loadHoTocCard(){
    const card=document.getElementById("hl-card-hotoc");
    const cardRow=card?.closest(".hl-card-row");
    if(!card||!cardRow)return;

    if(activeQueHuongPanel){
        activeQueHuongPanel.remove();
        activeQueHuongPanel=null;
    }

    const panel=document.createElement("div");
    panel.className="hl-quehuong-inline-panel";
    panel.innerHTML=`
        <div class="hl-quehuong-inline-header">
            <div>
                <span class="hl-quehuong-inline-label">HỌ TỘC</span>
                <h3>Họ tộc Hiền Lương</h3>
            </div>
            <button type="button" class="hl-quehuong-inline-close">×</button>
        </div>
        <div class="hl-quehuong-inline-activities">
            <div class="hl-card-list-loading">⏳ Đang tải danh sách...</div>
        </div>
    `;

    cardRow.insertAdjacentElement("afterend",panel);
    activeQueHuongPanel=panel;
    panel.scrollIntoView({behavior:"smooth",block:"nearest"});

    const listBox=panel.querySelector(".hl-quehuong-inline-activities");
    const closeButton=panel.querySelector(".hl-quehuong-inline-close");

    closeButton.addEventListener("click",function(){
        panel.remove();
        if(activeQueHuongPanel===panel)activeQueHuongPanel=null;
    });

    const renderList=async function(){
        const module=await loadModule("hotoc");
        if(!module||typeof module.getList!=="function"){
            listBox.innerHTML='<div class="hl-card-list-empty">Chưa có dữ liệu.</div>';
            return;
        }

        const list=await module.getList();
        if(!list||!list.length){
            listBox.innerHTML='<div class="hl-card-list-empty">Chưa có dữ liệu.</div>';
            return;
        }

        const thumb=card.querySelector(".hl-thumb");
        if(thumb&&list[0].image){
            thumb.innerHTML=`<img src="${list[0].image}" alt="Họ tộc Hiền Lương" loading="lazy" decoding="async">`;
        }

        listBox.innerHTML=list.map(item=>`
            <button type="button" class="hl-quehuong-inline-item" data-hotoc-id="${item.id}">
                <span class="hl-quehuong-inline-year">👪</span>
                <span class="hl-quehuong-inline-title">${item.name||"Chưa có tên"}</span>
                <span class="hl-quehuong-inline-arrow">→</span>
            </button>
        `).join("");

        listBox.querySelectorAll(".hl-quehuong-inline-item").forEach(item=>{
            item.addEventListener("click",async function(event){
                event.stopPropagation();
                const id=this.dataset.hotocId;
                if(!id)return;

                const module=await loadModule("hotoc");
                if(!module||typeof module.renderItemInline!=="function"){
                    console.warn("⚠️ HỌ TỘC CHƯA CÓ renderItemInline()");
                    return;
                }

                await module.renderItemInline(id,listBox);
            });
        });
    };

    window.loadHoTocInlineList=renderList;
    await renderList();
}

async function loadTuLieuCard(){
    const card=document.getElementById("hl-card-tulieu");
    const cardRow=card?.closest(".hl-card-row");
    if(!card||!cardRow)return;

    if(activeQueHuongPanel){
        activeQueHuongPanel.remove();
        activeQueHuongPanel=null;
    }

    const panel=document.createElement("div");
    panel.className="hl-quehuong-inline-panel";
    panel.innerHTML=`
        <div class="hl-quehuong-inline-header">
            <div>
                <span class="hl-quehuong-inline-label">TƯ LIỆU</span>
                <h3>Tư liệu Hiền Lương</h3>
            </div>
            <button type="button" class="hl-quehuong-inline-close">×</button>
        </div>
        <div class="hl-quehuong-inline-activities">
            <div class="hl-card-list-loading">⏳ Đang tải danh sách...</div>
        </div>
    `;

    cardRow.insertAdjacentElement("afterend",panel);
    activeQueHuongPanel=panel;
    panel.scrollIntoView({behavior:"smooth",block:"nearest"});

    const listBox=panel.querySelector(".hl-quehuong-inline-activities");
    const closeButton=panel.querySelector(".hl-quehuong-inline-close");

    closeButton.addEventListener("click",function(){
        panel.remove();
        if(activeQueHuongPanel===panel)activeQueHuongPanel=null;
    });

    const renderList=async function(){
        const module=await loadModule("tulieu");
        if(!module||typeof module.getList!=="function"){
            listBox.innerHTML='<div class="hl-card-list-empty">Chưa có dữ liệu.</div>';
            return;
        }

        const list=await module.getList();
        if(!list||!list.length){
            listBox.innerHTML='<div class="hl-card-list-empty">Chưa có dữ liệu.</div>';
            return;
        }

        const thumb=card.querySelector(".hl-thumb");
        if(thumb&&list[0].image){
            thumb.innerHTML=`<img src="${list[0].image}" alt="Tư liệu Hiền Lương" loading="lazy" decoding="async">`;
        }

        listBox.innerHTML=list.map(item=>`
            <button type="button" class="hl-quehuong-inline-item" data-tulieu-id="${item.id}">
                <span class="hl-quehuong-inline-year">📚</span>
                <span class="hl-quehuong-inline-title">${item.title||"Chưa có tiêu đề"}</span>
                <span class="hl-quehuong-inline-arrow">→</span>
            </button>
        `).join("");

        listBox.querySelectorAll(".hl-quehuong-inline-item").forEach(item=>{
            item.addEventListener("click",async function(event){
                event.stopPropagation();
                const id=this.dataset.tulieuId;
                if(!id)return;

                const module=await loadModule("tulieu");
                if(!module||typeof module.renderItemInline!=="function"){
                    console.warn("⚠️ TƯ LIỆU CHƯA CÓ renderItemInline()");
                    return;
                }

                await module.renderItemInline(id,listBox);
            });
        });
    };

    window.loadTuLieuInlineList=renderList;
    await renderList();
}

async function updateThongBaoBadge(){
    const module=await loadModule("thongbao");
    if(!module)return;
    const list=await module.getList();
    if(!list||!list.length){
        updateThongBaoBadgeUI(0);
        return;
    }
    const lastSeen=Number(localStorage.getItem("thongbao_last_seen")||0);
    const newCount=list.filter(item=>(Number(item.updated_at)||0)>lastSeen).length;
    updateThongBaoBadgeUI(newCount);
}

async function loadThongBaoCard(){
    const card=document.getElementById("hl-card-thongbao");
    const cardRow=card?.closest(".hl-card-row");
    if(!card||!cardRow)return;

    if(activeQueHuongPanel){
        activeQueHuongPanel.remove();
        activeQueHuongPanel=null;
    }

    const panel=document.createElement("div");
    panel.className="hl-quehuong-inline-panel";
    panel.innerHTML=`
        <div class="hl-quehuong-inline-header">
            <div>
                <span class="hl-quehuong-inline-label">THÔNG BÁO</span>
                <h3>Làng thông báo</h3>
            </div>
            <button type="button" class="hl-quehuong-inline-close">×</button>
        </div>
        <div class="hl-quehuong-inline-activities">
            <div class="hl-card-list-loading">⏳ Đang tải danh sách...</div>
        </div>
    `;

    cardRow.insertAdjacentElement("afterend",panel);
    activeQueHuongPanel=panel;
    panel.scrollIntoView({behavior:"smooth",block:"nearest"});

    const listBox=panel.querySelector(".hl-quehuong-inline-activities");
    const closeButton=panel.querySelector(".hl-quehuong-inline-close");

    closeButton.addEventListener("click",function(){
        panel.remove();
        if(activeQueHuongPanel===panel)activeQueHuongPanel=null;
    });

    const renderList=async function(){
        const module=await loadModule("thongbao");
        if(!module||typeof module.getList!=="function"){
            listBox.innerHTML='<div class="hl-card-list-empty">Chưa có thông báo.</div>';
            return;
        }

        const list=await module.getList();
        if(!list||!list.length){
            listBox.innerHTML='<div class="hl-card-list-empty">Chưa có thông báo.</div>';
            return;
        }

        listBox.innerHTML=list.map(item=>`
            <button type="button" class="hl-quehuong-inline-item" data-thongbao-id="${item.id}">
                <span class="hl-quehuong-inline-year">📢</span>
                <span class="hl-quehuong-inline-title">${item.title||"Thông báo"}</span>
                <span class="hl-quehuong-inline-arrow">→</span>
            </button>
        `).join("");

        listBox.querySelectorAll(".hl-quehuong-inline-item").forEach(item=>{
            item.addEventListener("click",async function(event){
                event.stopPropagation();
                const id=this.dataset.thongbaoId;
                if(!id)return;

                const module=await loadModule("thongbao");
                if(!module||typeof module.renderItemInline!=="function"){
                    console.warn("⚠️ THÔNG BÁO CHƯA CÓ renderItemInline()");
                    return;
                }

                await module.renderItemInline(id,listBox);
            });
        });

        const latestUpdated=Math.max(...list.map(item=>Number(item.updated_at)||0));
        if(latestUpdated>0){
            localStorage.setItem("thongbao_last_seen",String(latestUpdated));
            updateThongBaoBadgeUI(0);
        }
    };

    window.loadThongBaoInlineList=renderList;
    await renderList();
}

function updateThongBaoBadgeUI(count){
    document.querySelectorAll(".hl-thongbao-badge").forEach(badge=>{
        if(count>0){
            badge.textContent=`NEW ${count}`;
            badge.style.display="inline-flex";
        }else{
            badge.style.display="none";
        }
    });
}

function getChuyenHangNgayReadIds(){
    try{
        return JSON.parse(localStorage.getItem("chuyenhangngay_read_ids")||"[]");
    }catch{
        return [];
    }
}

function saveChuyenHangNgayReadIds(ids){
    localStorage.setItem("chuyenhangngay_read_ids",JSON.stringify(ids));
}

function updateChuyenHangNgayBadgeUI(count){
    document.querySelectorAll(".hl-chuyenhangngay-badge").forEach(badge=>{
        if(count>0){
            badge.textContent=`NEW ${count}`;
            badge.style.display="inline-flex";
        }else{
            badge.style.display="none";
        }
    });
}

function updateChuyenHangNgayBadge(list){
    if(!list||!list.length){
        updateChuyenHangNgayBadgeUI(0);
        return;
    }

    const readIds=getChuyenHangNgayReadIds();
    const unread=list.filter(item=>!readIds.includes(item.id));
    updateChuyenHangNgayBadgeUI(unread.length);
}

async function updateChuyenHangNgayBadgeOnStart(){
    try{
        const module=await loadModule("chuyenhangngay");
        if(!module)return;
        const list=await module.getList();
        updateChuyenHangNgayBadge(list);
    }catch(err){
        console.error("❌ LOAD BADGE CHUYỆN HÀNG NGÀY ERROR:",err);
        updateChuyenHangNgayBadgeUI(0);
    }
}

function markChuyenHangNgayRead(id){
    if(!id)return;
    const readIds=getChuyenHangNgayReadIds();
    if(!readIds.includes(id)){
        readIds.push(id);
        saveChuyenHangNgayReadIds(readIds);
    }
}


async function loadChuyenHangNgayCard(){
    const card=document.getElementById("hl-card-chuyenhangngay");
    const cardRow=card?.closest(".hl-card-row");
    if(!card||!cardRow)return;

    if(activeQueHuongPanel){
        activeQueHuongPanel.remove();
        activeQueHuongPanel=null;
    }

    const panel=document.createElement("div");
    panel.className="hl-quehuong-inline-panel";
    panel.innerHTML=`
        <div class="hl-quehuong-inline-header">
            <div>
                <span class="hl-quehuong-inline-label">TIN HÀNG NGÀY</span>
                <h3>Câu chuyện mỗi ngày</h3>
            </div>
            <button type="button" class="hl-quehuong-inline-close">×</button>
        </div>
        <div class="hl-quehuong-inline-activities">
            <div class="hl-card-list-loading">⏳ Đang tải danh sách...</div>
        </div>
    `;

    cardRow.insertAdjacentElement("afterend",panel);
    activeQueHuongPanel=panel;
    panel.scrollIntoView({behavior:"smooth",block:"nearest"});

    const listBox=panel.querySelector(".hl-quehuong-inline-activities");
    const closeButton=panel.querySelector(".hl-quehuong-inline-close");

    closeButton.addEventListener("click",function(){
        panel.remove();
        if(activeQueHuongPanel===panel)activeQueHuongPanel=null;
    });

    const renderList=async function(){
        const module=await loadModule("chuyenhangngay");
        if(!module||typeof module.getList!=="function"){
            listBox.innerHTML='<div class="hl-card-list-empty">Chưa có chuyện hàng ngày.</div>';
            return;
        }

        const list=await module.getList();
        updateChuyenHangNgayBadge(list);

        if(!list||!list.length){
            listBox.innerHTML='<div class="hl-card-list-empty">Chưa có chuyện hàng ngày.</div>';
            return;
        }

        const latest=list.find(item=>item.image);
        const thumb=card.querySelector(".hl-thumb");
        if(latest?.image&&thumb){
            thumb.innerHTML="";
            const img=document.createElement("img");
            img.src=latest.image;
            img.alt="Tin hàng ngày";
            img.loading="eager";
            img.decoding="async";
            thumb.appendChild(img);
        }

        listBox.innerHTML=list.slice(0,5).map(item=>`
            <button type="button" class="hl-quehuong-inline-item" data-chuyenhangngay-id="${item.id}">
                <span class="hl-quehuong-inline-year">📰</span>
                <span class="hl-quehuong-inline-title">${item.title||"Chuyện của tôi"}</span>
                <span class="hl-quehuong-inline-arrow">→</span>
            </button>
        `).join("");

        listBox.querySelectorAll(".hl-quehuong-inline-item").forEach(item=>{
            item.addEventListener("click",async function(event){
                event.stopPropagation();
                const id=this.dataset.chuyenhangngayId;
                if(!id)return;

                markChuyenHangNgayRead(id);
                updateChuyenHangNgayBadge(list);

                const module=await loadModule("chuyenhangngay");
                if(!module||typeof module.renderItemInline!=="function"){
                    console.warn("⚠️ CHUYỆN HÀNG NGÀY CHƯA CÓ renderItemInline()");
                    return;
                }

                await module.renderItemInline(id,listBox);
            });
        });
    };

    window.loadChuyenHangNgayInlineList=renderList;
    await renderList();
}


async function loadBaiVietCard(){
    const card=document.getElementById("hl-card-baiviet");
    const cardRow=card?.closest(".hl-card-row");
    if(!card||!cardRow)return;

    if(activeQueHuongPanel){
        activeQueHuongPanel.remove();
        activeQueHuongPanel=null;
    }

    const panel=document.createElement("div");
    panel.className="hl-quehuong-inline-panel";
    panel.innerHTML=`
        <div class="hl-quehuong-inline-header">
            <div>
                <span class="hl-quehuong-inline-label">THƯ VIỆN BÀI VIẾT</span>
                <h3>Thư viện bài viết Hiền Lương</h3>
            </div>
            <button type="button" class="hl-quehuong-inline-close">×</button>
        </div>
        <div class="hl-quehuong-inline-activities">
            <div class="hl-card-list-loading">⏳ Đang tải danh sách...</div>
        </div>
    `;

    cardRow.insertAdjacentElement("afterend",panel);
    activeQueHuongPanel=panel;
    panel.scrollIntoView({behavior:"smooth",block:"nearest"});

    const listBox=panel.querySelector(".hl-quehuong-inline-activities");
    const closeButton=panel.querySelector(".hl-quehuong-inline-close");

    closeButton.addEventListener("click",function(){
        panel.remove();
        if(activeQueHuongPanel===panel)activeQueHuongPanel=null;
    });

        const renderList=async function(){
    
    const module=await loadModule("baiviet");
    
        if(!module||typeof module.getList!=="function"){
            listBox.innerHTML='<div class="hl-card-list-empty">Chưa có bài viết.</div>';
            return;
        }

        const list=await module.getList();
        if(!list||!list.length){
            listBox.innerHTML='<div class="hl-card-list-empty">Chưa có bài viết.</div>';
            return;
        }

        const latest=list.find(item=>item.image);
        const thumb=card.querySelector(".hl-thumb");
        if(latest?.image&&thumb){
            thumb.innerHTML="";
            const img=document.createElement("img");
            img.src=latest.image;
            img.alt="Bài viết cá nhân";
            img.loading="eager";
            img.decoding="async";
            thumb.appendChild(img);
        }

        listBox.innerHTML=list.slice(0,5).map(item=>`
            <button type="button" class="hl-quehuong-inline-item" data-baiviet-id="${item.id}">
                <span class="hl-quehuong-inline-year">✍️</span>
                <span class="hl-quehuong-inline-title">${item.caption||"Bài viết cá nhân"}</span>
                <span class="hl-quehuong-inline-arrow">→</span>
            </button>
        `).join("");

        listBox.querySelectorAll(".hl-quehuong-inline-item").forEach(item=>{
            item.addEventListener("click",async function(event){
                event.stopPropagation();
                const id=this.dataset.baivietId;
                if(!id)return;

                const module=await loadModule("baiviet");
                if(!module||typeof module.renderItemInline!=="function"){
                    console.warn("⚠️ BÀI VIẾT CHƯA CÓ renderItemInline()");
                    return;
                }

                await module.renderItemInline(id,listBox);
            });
        });
    };

    window.loadBaiVietInlineList=renderList;
	
	await renderList();
}

async function loadThanhVienCard(){
    const card=document.getElementById("hl-card-thanhvien");
    const cardRow=card?.closest(".hl-card-row");
    if(!card||!cardRow)return;

    if(activeQueHuongPanel){
        activeQueHuongPanel.remove();
        activeQueHuongPanel=null;
    }

    const panel=document.createElement("div");
    panel.className="hl-quehuong-inline-panel";
    panel.innerHTML=`
        <div class="hl-quehuong-inline-header">
            <div>
                <span class="hl-quehuong-inline-label">CỘNG ĐỒNG</span>
                
            </div>
            <button type="button" class="hl-quehuong-inline-close">×</button>
        </div>
        <div class="hl-quehuong-inline-activities">
            <div class="hl-card-list-loading">⏳ Đang tải danh sách...</div>
        </div>
    `;

    cardRow.insertAdjacentElement("afterend",panel);
    activeQueHuongPanel=panel;
    panel.scrollIntoView({behavior:"smooth",block:"nearest"});

    const listBox=panel.querySelector(".hl-quehuong-inline-activities");
    const closeButton=panel.querySelector(".hl-quehuong-inline-close");

    closeButton.addEventListener("click",function(){
        panel.remove();
        if(activeQueHuongPanel===panel)activeQueHuongPanel=null;
    });

    const renderList=async function(){
        const module=await loadModule("thanhvien");
        if(!module||typeof module.renderItemInline!=="function"){
            listBox.innerHTML='<div class="hl-card-list-empty">Chưa có danh sách thành viên.</div>';
            return;
        }

        await module.renderListInline(listBox);
    };

    window.loadThanhVienInlineList=renderList;
    await renderList();
}


async function loadHangKinhList(scrollToSection=true){
    

    const grid=document.getElementById("hl-hangkinh-grid");
    const section=document.getElementById("hl-hangkinh-section");
	let activeHangKinhPanel=null;
    if(!grid){
        console.warn("⚠️ KHÔNG TÌM THẤY #hl-hangkinh-grid");
        return;
    }

    grid.innerHTML=`<div class="hl-card-list-loading">Đang tải danh sách Hàng Kỉnh...</div>`;

    try{
        const module=await loadModule("hangkinh");

        if(!module||typeof module.getList!=="function"){
            console.error("❌ HÀNG KỈNH MODULE KHÔNG CÓ getList()");
            grid.innerHTML=`<div class="hl-empty">Không thể tải danh sách Hàng Kỉnh.</div>`;
            return;
        }

        const list=await module.getList();

        if(!list||!list.length){
            grid.innerHTML=`<div class="hl-empty">Chưa có Hàng Kỉnh nào được cập nhật.</div>`;
        }else{
            grid.innerHTML="";

            for(const item of list){
    const activities=await module.getActivities(item.id);
    const readKey=`hangkinh_activity_read_${item.id}`;
    const readList=JSON.parse(localStorage.getItem(readKey)||"[]");
    const newCount=activities.filter(activity=>!readList.includes(activity.id)).length;
    const button=document.createElement("button");

                button.type="button";
                button.className="hl-hangkinh-item";
                button.dataset.id=item.id;

                button.innerHTML=`
    <span class="hl-hangkinh-stt">${item.stt||""}</span>
    <span class="hl-hangkinh-info">
        <strong>${item.name||"Chưa đặt tên"}${newCount>0?` <b class="hl-hangkinh-new">New ${newCount}</b>`:""}</strong>
        <small>${item.city||""}</small>
        <small>👤 ${item.leader||""}</small>
    </span>
`;

        grid.appendChild(button);

	button.addEventListener("click",function(event){
    event.stopPropagation();

    if(activeHangKinhPanel){
        activeHangKinhPanel.remove();
        activeHangKinhPanel=null;
    }
    	const action=document.createElement("div");
    action.className="hl-hangkinh-action";

    action.innerHTML=`
        <button type="button" class="hl-hangkinh-login">
            🔐 Đăng nhập
        </button>
        <button type="button" class="hl-hangkinh-view">
            📋 Xem hoạt động
        </button>
    `;

const loginButton=action.querySelector(".hl-hangkinh-login");

loginButton.addEventListener("click",async function(event){
    event.stopPropagation();

    const id=item.id;

    try{
        const module=await loadModule("hangkinh");
        const list=await module.getList();
        const current=list.find(row=>row.id===id);

        if(!current){
            alert("❌ Không tìm thấy Hàng Kỉnh.");
            return;
        }

        const password=await showHangKinhLoginModal(current.name);

if(password===null){
    return;
}

try{
    await module.loginHangKinh(current,password);
}catch(error){
    alert(error.message||"❌ Không thể đăng nhập Hàng Kỉnh.");
}

    }
    catch(error){
        console.error("❌ HÀNG KỈNH LOGIN ERROR:",error);
        alert("❌ Không thể đăng nhập Hàng Kỉnh.");
    }
});

	const viewButton=action.querySelector(".hl-hangkinh-view");

viewButton.addEventListener("click",async function(event){
    event.stopPropagation();
    try{
        const activities=await module.getActivities(item.id);
	showHangKinhActivitiesInline(panel,item,activities);
    
}catch(error){
        console.error("❌ LOAD HÀNG KỈNH ACTIVITIES ERROR:",error);
        alert(error.message||"❌ Không thể tải hoạt động Hàng Kỉnh.");
    }
});

    	const panel=document.createElement("div");
	panel.className="hl-hangkinh-inline-panel";
	panel.innerHTML=`
    <div class="hl-hangkinh-inline-header">
        <strong>🏘️ ${item.name||"Hàng Kỉnh"}</strong>
        <button type="button" class="hl-hangkinh-inline-close">✕</button>
    </div>
    <div class="hl-hangkinh-inline-body"></div>
	`;
	const section=button.closest(".hl-card-section");
	if(section){
    	section.insertAdjacentElement("afterend",panel);
}
	activeHangKinhPanel=panel;
	panel.scrollIntoView({behavior:"smooth",block:"nearest"});
	panel.querySelector(".hl-hangkinh-inline-body").appendChild(action);
	panel.querySelector(".hl-hangkinh-inline-close").addEventListener("click",event=>{
   	event.stopPropagation();
    	panel.remove();
});
});
            }
        }

        if(scrollToSection&&section){
    section.scrollIntoView({
        behavior:"smooth",
        block:"center"
    });
}

        
    }
    catch(error){
        console.error("❌ LOAD HÀNG KỈNH LIST ERROR:",error);
        grid.innerHTML=`<div class="hl-empty">Không thể tải danh sách Hàng Kỉnh.</div>`;
    }
}

function showHangKinhActivitiesModal(item,activities){

    document.getElementById("hl-hangkinh-activity-modal")?.remove();

    const readKey=`hangkinh_activity_read_${item.id}`;
    const readList=JSON.parse(localStorage.getItem(readKey)||"[]");
    const modal=document.createElement("div");
    modal.id="hl-hangkinh-activity-modal";
    modal.className="hl-hangkinh-activity-modal";
    const list=activities||[];
    modal.innerHTML=`
        <div class="hl-hangkinh-activity-box">
            <div class="hl-hangkinh-activity-header">
                <strong>📋 Hoạt động - ${item.name||"Hàng Kỉnh"}</strong>
                <button type="button" class="hl-hangkinh-activity-close">✕</button>
            </div>
            <div class="hl-hangkinh-activity-list">
                ${list.length?list.map(activity=>`
                    <button type="button" class="hl-hangkinh-activity-item" data-id="${activity.id}">
                        <span class="hl-hangkinh-activity-title">
                            ${activity.title||"Không có tiêu đề"}
                            ${!readList.includes(activity.id)?`<b class="hl-hangkinh-activity-new">NEW</b>`:""}
                        </span>
                        <small>${activity.date||""} · ${activity.type||""}</small>
                    </button>
                `).join(""):`<div class="hl-empty">Chưa có hoạt động nào.</div>`}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector(".hl-hangkinh-activity-close")?.addEventListener("click",()=>{
        modal.remove();
    });

    modal.addEventListener("click",event=>{
        if(event.target===modal){
            modal.remove();
        }
    });

    const activityButtons=modal.querySelectorAll(".hl-hangkinh-activity-item");

    activityButtons.forEach(activityButton=>{
        activityButton.addEventListener("click",()=>{
            const activityId=activityButton.dataset.id;
            console.trace("🔎 TRACE SAU KHI CLICK ACTIVITY");
            const activity=list.find(row=>row.id===activityId);
            if(!activity){
                console.warn("⚠️ KHÔNG TÌM THẤY ACTIVITY:",activityId);
                return;
            }

            
            if(!readList.includes(activityId)){
                readList.push(activityId);
                localStorage.setItem(readKey,JSON.stringify(readList));
            }

            modal.remove();
            const content=document.getElementById("hl-content");
            if(!content){
                alert("❌ Không tìm thấy #hl-content");
                return;
            }

            content.innerHTML=`
                <div class="hl-hangkinh-activity-detail">
                    <button type="button" class="hl-hangkinh-back">← Trở lại</button>
                    ${activity.image?`<img src="${activity.image}" class="hl-hangkinh-activity-image" alt="${activity.title||""}">`:""}
                    <h2>${activity.title||"Không có tiêu đề"}</h2>
                    <div class="hl-hangkinh-activity-meta">
                        <span>📅 ${activity.date||""}</span>
                        <span>👤 ${activity.updater||activity.user||""}</span>
                    </div>
                    <div class="hl-hangkinh-activity-content">${activity.content||""}</div>
                </div>
            `;

            content.scrollIntoView({
                behavior:"smooth",
                block:"start"
            });

            content.querySelector(".hl-hangkinh-back")?.addEventListener("click",()=>{
                content.innerHTML="";
              loadHangKinhList(false);
                document.getElementById("hl-hangkinh-section")?.scrollIntoView({
                    behavior:"smooth",
                    block:"center"
                });
            });
        });
    });
}

function showHangKinhActivitiesInline(panel,item,activities){
    
    const body=panel.querySelector(".hl-hangkinh-inline-body");
    if(!body)return;
    const readKey=`hangkinh_activity_read_${item.id}`;
    const readList=JSON.parse(localStorage.getItem(readKey)||"[]");
    const list=activities||[];

    body.innerHTML=`
        <div class="hl-hangkinh-inline-activities">
            ${list.length?list.map(activity=>`
                <button type="button" class="hl-hangkinh-inline-activity-item" data-id="${activity.id}">
                    <strong>
                        ${activity.title||"Không có tiêu đề"}
                        ${!readList.includes(activity.id)?`<b class="hl-hangkinh-activity-new">NEW</b>`:""}
                    </strong>
                    <small>${activity.date||""} · ${activity.type||""}</small>
                </button>
            `).join(""):`<div class="hl-empty">Chưa có hoạt động nào.</div>`}
        </div>
    `;

    body.querySelectorAll(".hl-hangkinh-inline-activity-item").forEach(activityButton=>{
        activityButton.addEventListener("click",()=>{
            const activity=list.find(row=>row.id===activityButton.dataset.id);
            if(!activity)return;

            if(!readList.includes(activity.id)){
                readList.push(activity.id);
                localStorage.setItem(readKey,JSON.stringify(readList));
            }

            body.innerHTML=`
                <div class="hl-hangkinh-inline-activity-detail">
                    <button type="button" class="hl-hangkinh-inline-back">← Trở lại</button>
                    ${activity.image?`<img src="${activity.image}" alt="${activity.title||""}">`:""}
                    <h2>${activity.title||"Không có tiêu đề"}</h2>
                    <div class="hl-hangkinh-activity-meta">
                        <span>📅 ${activity.date||""}</span>
                        <span>👤 ${activity.updater||activity.user||""}</span>
                    </div>
                    <div class="hl-hangkinh-activity-content">${activity.content||""}</div>
                </div>
            `;

            body.querySelector(".hl-hangkinh-inline-back")?.addEventListener("click",()=>{
                showHangKinhActivitiesInline(panel,item,activities);
            });
        });
    });
}

function showHangKinhLoginModal(name){
    return new Promise(resolve=>{
        const old=document.getElementById("hl-hangkinh-login-modal");
        if(old)old.remove();

        const modal=document.createElement("div");
        modal.id="hl-hangkinh-login-modal";
        modal.className="hl-hangkinh-login-modal";

        modal.innerHTML=`
            <div class="hl-hangkinh-login-box">
                <button type="button" class="hl-hangkinh-login-close">×</button>
                <div class="hl-hangkinh-login-icon">🔐</div>
                <h3>Đăng nhập Hàng Kỉnh</h3>
                <p>${name||"Hàng Kỉnh"}</p>
                <input
                    type="password"
                    class="hl-hangkinh-password"
                    placeholder="Nhập mật khẩu"
                    autocomplete="current-password"
                >
                <div class="hl-hangkinh-login-actions">
                <button type="button" class="hl-hangkinh-submit">Đăng nhập</button>    
		<button type="button" class="hl-hangkinh-cancel">Hủy</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const input=modal.querySelector(".hl-hangkinh-password");
        const submit=modal.querySelector(".hl-hangkinh-submit");
        const cancel=modal.querySelector(".hl-hangkinh-cancel");
        const close=modal.querySelector(".hl-hangkinh-login-close");

        function finish(value){
            modal.remove();
            resolve(value);
        }

        submit.addEventListener("click",()=>{
            finish(input.value);
        });

        cancel.addEventListener("click",()=>{
            finish(null);
        });

        close.addEventListener("click",()=>{
            finish(null);
        });

	modal.querySelectorAll(".hl-hangkinh-activity-item").forEach(activityButton=>{
    activityButton.addEventListener("click",async()=>{
        const activityId=activityButton.dataset.id;
       const activity=activities.find(row=>row.id===activityId);

        if(!activity){
            console.warn("⚠️ KHÔNG TÌM THẤY ACTIVITY:",activityId);
            return;
        }

        const readKey=`hangkinh_activity_read_${item.id}`;
        const readList=JSON.parse(localStorage.getItem(readKey)||"[]");

        if(!readList.includes(activityId)){
            readList.push(activityId);
            localStorage.setItem(readKey,JSON.stringify(readList));
        }

        modal.remove();
        const content=document.getElementById("hl-content");

if(!content){
    alert("❌ Không tìm thấy #hl-content");
    return;
}

content.innerHTML=`
    <div style="padding:20px">
        <button type="button" class="hl-hangkinh-back">← Trở lại</button>
        <h2>${activity.title||"Không có tiêu đề"}</h2>
        <div>📅 ${activity.date||""}</div>
        <div>👤 ${activity.updater||activity.user||""}</div>
        <div>${activity.content||""}</div>
    </div>
`;
        content.innerHTML=`
            <div class="hl-hangkinh-activity-detail">
                <button type="button" class="hl-hangkinh-back">← Trở lại</button>
                ${activity.image?`<img src="${activity.image}" class="hl-hangkinh-activity-image" alt="${activity.title||""}">`:""}
                <h2>${activity.title||"Không có tiêu đề"}</h2>
                <div class="hl-hangkinh-activity-meta">
                    <span>📅 ${activity.date||""}</span>
                    <span>👤 ${activity.updater||activity.user||""}</span>
                </div>
                <div class="hl-hangkinh-activity-content">${activity.content||""}</div>
            </div>
        `;

        content.scrollIntoView({
            behavior:"smooth",
            block:"start"
        });

        document.querySelectorAll(".hl-hangkinh-item").forEach(button=>{
            if(button.dataset.id===item.id){
                const activities=JSON.parse(JSON.stringify(list));
                const remaining=activities.filter(row=>!readList.includes(row.id)).length;
                const badge=button.querySelector(".hl-hangkinh-new");

                if(remaining>0){
                    if(badge){
                        badge.textContent=`New ${remaining}`;
                    }
                }else if(badge){
                    badge.remove();
                }
            }
        });

        content.querySelector(".hl-hangkinh-back")?.addEventListener("click",()=>{
            content.innerHTML="";
            loadHangKinhList();
            document.getElementById("hl-hangkinh-section")?.scrollIntoView({
                behavior:"smooth",
                block:"center"
            });
        });
    });
});
        modal.addEventListener("click",event=>{
            if(event.target===modal){
                finish(null);
            }
        });

        input.addEventListener("keydown",event=>{
            if(event.key==="Enter"){
                finish(input.value);
            }
        });

        setTimeout(()=>{
            input.focus();
        },50);
    });
}
//======================================================
// MENU
//======================================================

function bindMenu() {
    document
        .querySelectorAll(
            ".hl-left .hl-menu, .hl-right .hl-menu"
        )
        .forEach(menu => {
            menu.onclick =
                async function(event) {
                event.stopPropagation();

                //======================================
                // XÓA ACTIVE
                //======================================

                document
                    .querySelectorAll(
                        ".hl-left .hl-menu, .hl-right .hl-menu"
                    )
                    .forEach(function(item) {
                        item.classList.remove(
                            "active"
                        );

                    });

                //======================================
                // ACTIVE MENU
                //======================================

                this.classList.add("active");

                //======================================
                // PAGE
                //======================================

                const page = this.dataset.page;
                if (!page) {
                    console.warn("⚠️ MENU KHÔNG CÓ data-page:",this);
                    return;
                }
                CURRENT_PAGE = page;

                //======================================
                // LEFT
                //======================================

                if (
                    this.closest(".hl-left")
                ) {

                    await handleLeftMenu(page,this);
                    return;
                }

                //======================================
                // RIGHT
                //======================================

                if (
                    this.closest(".hl-right")
                ) {
		   
                    await handleRightMenu(page);
                    return;
                }
            };
        });
}

//======================================================
// NEW NAVIGATION
//======================================================

function bindNewNavigation(){

	const langButtons=document.querySelectorAll(".hl-lang-btn");

function applyLanguage(){
console.log("🌐 APPLY LANGUAGE:",getLanguage());
    const lang=getLanguage();
    langButtons.forEach(btn=>{
        btn.classList.toggle("active",btn.dataset.lang===lang);
    });
    const subtitle=document.querySelector(".hl-title h3");
    if(subtitle)subtitle.textContent=t("header.subtitle");
    const marquee=document.querySelector(".hl-marquee marquee");
    if(marquee)marquee.textContent=t("marquee");
    
const navMap={
    home:"nav.home",
    menu:"nav.menu",
    community:"nav.community",
    hangkinh:"nav.hangkinh",
    khampha:"nav.explore",
    quylang:"nav.fund",
    personal:"nav.personal"
};
const exploreTitle=document.querySelector(".hl-nav-section-title small");
if(exploreTitle)exploreTitle.textContent=t("explore.title");
const exploreSubtitle=document.querySelector(".hl-nav-section-title strong");
if(exploreSubtitle)exploreSubtitle.textContent=t("explore.subtitle");
const exploreCards=document.querySelectorAll("#hl-nav-menu .hl-nav-card");

const exploreKeys=["intro","history","famous","tourism","craft","landmark","clan","documents","notice"];
exploreCards.forEach((card,index)=>{
    const text=card.querySelector(":scope > span:not(.hl-nav-icon):not(.hl-thongbao-badge)");
    if(text&&exploreKeys[index])text.textContent=t("explore."+exploreKeys[index]);
});

const communityTitle=document.querySelector("#hl-nav-community .hl-nav-section-title small");
if(communityTitle)communityTitle.textContent=t("community.title");
const communitySubtitle=document.querySelector("#hl-nav-community .hl-nav-section-title strong");
if(communitySubtitle)communitySubtitle.textContent=t("community.subtitle");
const communityCards=document.querySelectorAll("#hl-nav-community .hl-nav-card");
const communityKeys=["news","articles","members","finance"];
communityCards.forEach((card,index)=>{
    const text=card.querySelector(":scope > span:not(.hl-nav-icon):not(.hl-chuyenhangngay-badge)");
    if(text&&communityKeys[index])text.textContent=t("community."+communityKeys[index]);
});

const personalTitle=document.querySelector("#hl-nav-personal .hl-nav-section-title small");
if(personalTitle)personalTitle.textContent=t("personal.title");
const personalSubtitle=document.querySelector("#hl-nav-personal .hl-nav-section-title strong");
if(personalSubtitle)personalSubtitle.textContent=t("personal.subtitle");
const personalCards=document.querySelectorAll("#hl-nav-personal .hl-nav-card");
const personalKeys=["login","register"];
personalCards.forEach((card,index)=>{
    const text=card.querySelector(":scope > span:not(.hl-nav-icon)");
    if(text&&personalKeys[index])text.textContent=t("personal."+personalKeys[index]);
});

const hero=document.querySelector("#hl-home-cards");
if(hero){
    const headings=hero.querySelectorAll(".hl-section-heading h2");
    if(headings[0])headings[0].textContent=t("hero.title");
    if(headings[1]){
        headings[1].innerHTML=`${t("hero.heading")} <span class="hl-500-years">${t("hero.years")}</span><br>${t("hero.heading2")}`;
    }
    const description=hero.querySelector(".hl-section-heading p");
    if(description)description.textContent=t("hero.description");
}

const cultureSection=document.querySelector(".hl-card-section");
if(cultureSection){
    const title=cultureSection.querySelector(".hl-card-section-title small");
    const heading=cultureSection.querySelector(".hl-card-section-title h3");
    if(title)title.textContent=t("culture.title");
    if(heading)heading.textContent=t("culture.heading");

    const cultureCards=[
        ["intro","introDesc"],
        ["history","historyDesc"],
        ["famous","famousDesc"],
        ["tourism","tourismDesc"],
        ["craft","craftDesc"],
        ["landmark","landmarkDesc"],
        ["clan","clanDesc"],
        ["documents","documentsDesc"],
        ["notice","noticeDesc"]
    ];

    const cards=cultureSection.querySelectorAll(".hl-content-card");
    cards.forEach((card,index)=>{
        const data=cultureCards[index];
        if(!data)return;
        const heading=card.querySelector(".hl-card-body h3");
        const description=card.querySelector(".hl-card-body p");
        if(heading)heading.textContent=t("culture."+data[0]);
        if(description)description.textContent=t("culture."+data[1]);
    });
}

const communitySection=document.querySelectorAll(".hl-card-section")[1];
if(communitySection){
    const title=communitySection.querySelector(".hl-card-section-title small");
    const heading=communitySection.querySelector(".hl-card-section-title h3");
    if(title)title.textContent=t("communityCards.title");
    if(heading)heading.textContent=t("communityCards.heading");

    const communityCards=[
        ["news","newsDesc"],
        ["articles","articlesDesc"],
        ["members","membersDesc"],
        ["finance","financeDesc"]
    ];

    const cards=communitySection.querySelectorAll(".hl-content-card");
    cards.forEach((card,index)=>{
        const data=communityCards[index];
        if(!data)return;
        const heading=card.querySelector(".hl-card-body h3");
        const description=card.querySelector(".hl-card-body p");
        if(heading)heading.textContent=t("communityCards."+data[0]);
        if(description)description.textContent=t("communityCards."+data[1]);
    });
}

const hangkinhSection=document.querySelector("#hl-hangkinh-section");
if(hangkinhSection){
    const title=hangkinhSection.querySelector(".hl-card-section-title small");
    const heading=hangkinhSection.querySelector(".hl-card-section-title h3");
    const paragraphs=hangkinhSection.querySelectorAll(".hl-card-section-title p");
    if(title)title.textContent=t("hangkinh.title");
    if(heading)heading.textContent=t("hangkinh.heading");
    if(paragraphs[0])paragraphs[0].innerHTML=`<strong>${t("hangkinh.motto")}</strong>`;
    if(paragraphs[1])paragraphs[1].textContent=t("hangkinh.intro");
    if(paragraphs[2])paragraphs[2].innerHTML=`<strong>${t("hangkinh.listTitle")}</strong>`;

    const loading=hangkinhSection.querySelector("#hl-hangkinh-grid .hl-card-list-loading");
    if(loading)loading.textContent=t("hangkinh.loading");
}

const tienthoSection=document.querySelector("#hl-vinhdanh-tientho");
if(tienthoSection){
    const label=tienthoSection.querySelector(".hl-vinhdanh-label");
    const title=tienthoSection.querySelector(".hl-vinhdanh-header h2");
    const description=tienthoSection.querySelector(".hl-vinhdanh-header p");
    const loading=tienthoSection.querySelector(".hl-vinhdanh-loading");
    if(label)label.textContent=t("tientho.label");
    if(title)title.textContent=t("tientho.title");
    if(description)description.textContent=t("tientho.description");
    if(loading)loading.textContent=t("tientho.loading");
}

const thuocphimSection=document.querySelector("#hl-thuocphim-quy");
if(thuocphimSection){
    const label=thuocphimSection.querySelector(".hl-thuocphim-label");
    const title=thuocphimSection.querySelector(".hl-thuocphim-header h2");
    const description=thuocphimSection.querySelector(".hl-thuocphim-header p");
    const screenTitle=thuocphimSection.querySelector(".hl-thuocphim-tv-placeholder strong");
    const screenHint=thuocphimSection.querySelector(".hl-thuocphim-tv-placeholder small");
    const loading=thuocphimSection.querySelector(".hl-card-list-loading");
    if(label)label.textContent=t("thuocphim.label");
    if(title)title.textContent=t("thuocphim.title");
    if(description)description.textContent=t("thuocphim.description");
    if(screenTitle)screenTitle.textContent=t("thuocphim.screenTitle");
    if(screenHint)screenHint.textContent=t("thuocphim.screenHint");
    if(loading)loading.textContent=t("thuocphim.loading");
}

const tuhaoSection=document.querySelector(".hl-tuhao-section");
if(tuhaoSection){
    const label=tuhaoSection.querySelector(".hl-tuhao-label");
    const title=tuhaoSection.querySelector(".hl-tuhao-header h2");
    if(label)label.textContent=t("tuhao.label");
    if(title)title.textContent=t("tuhao.title");

    const tuhaoItems=[
        ["street1","desc1"],
        ["street2","desc2"],
        ["street3","desc3"],
        ["street4","desc4"],
        ["street5","desc5"],
        ["street6","desc6"]
    ];

    const items=tuhaoSection.querySelectorAll(".hl-tuhao-item");
    items.forEach((item,index)=>{
        const data=tuhaoItems[index];
        if(!data)return;
        const heading=item.querySelector("h3");
        const description=item.querySelector("p");
        if(heading)heading.textContent=t("tuhao."+data[0]);
        if(description)description.textContent=t("tuhao."+data[1]);
    });
}
const disanSection=document.querySelector("#hl-disan-langnghe");
if(disanSection){
    const label=disanSection.querySelector(".hl-disan-langnghe-label");
    const title=disanSection.querySelector(".hl-disan-langnghe-header h2");
    const subtitle=disanSection.querySelector(".hl-disan-langnghe-header h3");
    const description=disanSection.querySelector(".hl-disan-langnghe-header p");
    if(label)label.textContent=t("disan.label");
    if(title)title.textContent=t("disan.title");
    if(subtitle)subtitle.textContent=t("disan.subtitle");
    if(description)description.textContent=t("disan.description");

    const items=disanSection.querySelectorAll(".hl-disan-langnghe-item");
    items.forEach(item=>{
        const type=item.dataset.disan;
        if(!type)return;
        const heading=item.querySelector(".hl-disan-langnghe-body h3");
        const text=item.querySelector(".hl-disan-langnghe-body p");
        const quote=item.querySelector(".hl-disan-langnghe-body em");
        if(heading)heading.textContent=t(`disan.${type}.title`);
        if(text)text.textContent=t(`disan.${type}.description`);
        if(quote)quote.textContent=t(`disan.${type}.quote`);
    });
}

const guibaiSection=document.querySelector(".hl-guibai-section");
if(guibaiSection){
    const label=guibaiSection.querySelector(".hl-guibai-label");
    const title=guibaiSection.querySelector(".hl-guibai-header h2");
    const description=guibaiSection.querySelector(".hl-guibai-header p");
    const labels=guibaiSection.querySelectorAll(".hl-guibai-field label");
    const submit=guibaiSection.querySelector(".hl-guibai-submit");
    if(label)label.textContent=t("guibai.label");
    if(title)title.textContent=t("guibai.title");
    if(description)description.textContent=t("guibai.description");
    if(labels[0])labels[0].textContent=t("guibai.author");
    if(labels[1])labels[1].textContent=t("guibai.phone");
    if(labels[2])labels[2].textContent=t("guibai.branch");
    if(labels[3])labels[3].textContent=t("guibai.content");
    if(submit)submit.innerHTML=`<span>✦</span> ${t("guibai.submit")}`;
}
const footer=document.querySelector(".hl-footer");
if(footer){
    const aboutTitle=footer.querySelector(".hl-footer-about h3");
    const aboutText=footer.querySelector(".hl-footer-about p");
    const contactTitle=footer.querySelector(".hl-footer-contact h3");
    const mapTitle=footer.querySelector(".hl-footer-map h3");
    const contactRows=footer.querySelectorAll(".hl-footer-contact-row");
    const mapLink=footer.querySelector(".hl-footer-map-link");
    const version=footer.querySelector(".hl-footer-version");
    const admin=footer.querySelector(".hl-footer-admin");
    const copyright=footer.querySelector(".hl-footer-bottom");
    if(aboutTitle)aboutTitle.textContent=t("footer.title");
    if(aboutText)aboutText.textContent=t("footer.about");
    if(contactTitle)contactTitle.textContent=t("footer.contact");
    if(contactRows[0])contactRows[0].querySelector("span:last-child").textContent=t("footer.address");
    if(contactRows[1])contactRows[1].querySelector("span:last-child").textContent=t("footer.hotline");
    if(mapTitle)mapTitle.textContent=t("footer.map");
    if(contactRows[2])contactRows[2].querySelector("span:last-child").textContent="langrenhienluong@gmail.com";
    if(contactRows[3])contactRows[3].querySelector("span:last-child").textContent=t("footer.distance");
    if(mapLink)mapLink.textContent=t("footer.mapLink");
    if(version)version.innerHTML=`${t("footer.version")}<br>${t("footer.written")}`;
    if(admin)admin.setAttribute("aria-label",t("footer.admin"));
    if(copyright)copyright.textContent=t("footer.copyright");
}
const mobileNav=document.querySelector("#mobile-bottom-nav");
if(mobileNav){
    const labels=mobileNav.querySelectorAll(".mobile-bottom-label");
    if(labels[0])labels[0].textContent=t("mobile.home");
    if(labels[1])labels[1].textContent=t("mobile.category");
    if(labels[2])labels[2].textContent=t("mobile.community");
    if(labels[3])labels[3].textContent=t("mobile.personal");
}

const mobileCategory=document.querySelector("#mobile-category-panel");
if(mobileCategory){
    const title=mobileCategory.querySelector(".mobile-bottom-panel-title");
    const items=mobileCategory.querySelectorAll(".mobile-panel-item");
    if(title)title.textContent=t("mobileCategory.title");
    const categoryKeys=[
        "intro",
        "history",
        "famous",
        "tourism",
        "craft",
        "landmark",
        "clan",
        "documents",
        "notice"
    ];
    items.forEach((item,index)=>{
        if(categoryKeys[index])item.textContent=t(`mobileCategory.${categoryKeys[index]}`);
    });
}

const mobileCommunity=document.querySelector("#mobile-community-panel");
if(mobileCommunity){
    const title=mobileCommunity.querySelector(".mobile-bottom-panel-title");
    const items=mobileCommunity.querySelectorAll(".mobile-panel-item");
    if(title)title.textContent=t("mobileCommunity.title");
    const keys=["news","articles","members","finance"];
    items.forEach((item,index)=>{
        if(keys[index])item.textContent=t(`mobileCommunity.${keys[index]}`);
    });
}

const mobilePersonal=document.querySelector("#mobile-personal-panel");
if(mobilePersonal){
    const title=mobilePersonal.querySelector(".mobile-bottom-panel-title");
    const items=mobilePersonal.querySelectorAll(".mobile-panel-item");
    if(title)title.textContent=t("mobilePersonal.title");
    if(items[0])items[0].textContent=t("mobilePersonal.login");
    if(items[1])items[1].textContent=t("mobilePersonal.register");
}



Object.entries(navMap).forEach(([nav,key])=>{
    const item=document.querySelector(`.hl-main-nav-item[data-nav="${nav}"] strong`);
    if(item)item.textContent=t(key);
});
}

langButtons.forEach(button=>{
    button.addEventListener("click",function(event){
        event.stopPropagation();
        const lang=this.dataset.lang;
        localStorage.setItem("hl-language",lang);
        applyLanguage();
        const select=document.querySelector(".goog-te-combo");
        if(select){
            select.value=lang;
            select.dispatchEvent(new Event("change",{bubbles:true}));
        }
        console.log("🌐 LANGUAGE:",lang);
    });
});

applyLanguage();

	const vinhDanhList=document.querySelector(".hl-vinhdanh-list");
	if(vinhDanhList){
    	vinhDanhList.addEventListener("click",async function(event){
        const item=event.target.closest(".hl-vinhdanh-item");
        if(!item)return;
        event.stopPropagation();
        const danhNhanId=item.dataset.danhnhanId;
        if(!danhNhanId)return;
        const danhNhanCard=document.getElementById("hl-card-danhnhan");
        if(!danhNhanCard){
            console.warn("⚠️ KHÔNG TÌM THẤY CARD DANH NHÂN");
            return;
        }
        await loadDanhNhanCard();
        requestAnimationFrame(()=>{
            const target=document.querySelector('.hl-quehuong-inline-item[data-danhnhan-id="'+danhNhanId+'"]');

            if(!target){
                console.warn("⚠️ KHÔNG TÌM THẤY TIỀN HIỀN:",danhNhanId);
                return;
            }

            target.scrollIntoView({
                behavior:"smooth",
                block:"center"
            });

            const targetName=target.querySelector(".hl-quehuong-inline-title");
		if(targetName){
    		targetName.classList.add("hl-danhnhan-name-target");
		}
            });
         });
      }


	const khamPha=document.querySelector('.hl-main-nav-item[data-nav="khampha"]');
	if(khamPha){
    	khamPha.addEventListener("click",function(event){
        event.stopPropagation();
        const diSanLangNghe=document.getElementById("hl-disan-langnghe");
        if(!diSanLangNghe){
            console.warn("⚠️ KHÔNG TÌM THẤY KHU DI SẢN LÀNG NGHỀ");
            return;
        }

        diSanLangNghe.scrollIntoView({
            behavior:"smooth",
            block:"start"
        });
    });
}

	const tuHao=document.querySelector(".hl-tuhao-section");
	if(tuHao){
   	tuHao.addEventListener("click",async function(event){
        event.stopPropagation();
        const danhNhanCard=document.getElementById("hl-card-danhnhan");
        if(!danhNhanCard){
            console.warn("⚠️ KHÔNG TÌM THẤY CARD DANH NHÂN");
            return;
        }

        await loadDanhNhanCard();
        requestAnimationFrame(()=>{
            danhNhanCard.scrollIntoView({
                behavior:"smooth",
                block:"center"
            });

            danhNhanCard.classList.add("hl-card-focus");
            setTimeout(()=>danhNhanCard.classList.remove("hl-card-focus"),1200);
        });
    });
}

	const diSanLangNghe=document.getElementById("hl-disan-langnghe");
	if(diSanLangNghe){
    	diSanLangNghe.addEventListener("click",async function(event){
        const item=event.target.closest(".hl-disan-langnghe-item");
        if(!item)return;
        event.stopPropagation();
        const amThucCard=document.getElementById("hl-card-amthuc");
        if(!amThucCard){
            console.warn("⚠️ KHÔNG TÌM THẤY CARD ẨM THỰC");
            return;
        }
        await loadAmThucCard();
        requestAnimationFrame(()=>{
            amThucCard.scrollIntoView({
                behavior:"smooth",
                block:"center"
            });

            amThucCard.classList.add("hl-card-focus");
            setTimeout(()=>amThucCard.classList.remove("hl-card-focus"),1200);
        });
    });
}


    	const nav=document.getElementById("hl-main-nav");
    	const menuPanel=document.getElementById("hl-nav-menu");
    	const communityPanel=document.getElementById("hl-nav-community");
    	const personalPanel=document.getElementById("hl-nav-personal");
	
    	if(nav){
        nav.addEventListener("click",async function(event){
            const button=event.target.closest(".hl-main-nav-item");
            if(!button)return;
            event.stopPropagation();
            const navType=button.dataset.nav;
            document.querySelectorAll(".hl-main-nav-item").forEach(item=>item.classList.remove("active"));
            button.classList.add("active");
            if(menuPanel)menuPanel.style.display="none";
            if(communityPanel)communityPanel.style.display="none";
            if(personalPanel)personalPanel.style.display="none";
            if(navType==="home"){
                showBackground();
                const content=document.getElementById("hl-content");
                if(content)content.innerHTML="";
                const main=document.querySelector(".hl-main");
                if(main)main.classList.remove("mobile-columns-hidden");
                return;
            }

            if(navType==="menu"){
                if(menuPanel)menuPanel.style.display="block";
                return;
            }

            if(navType==="community"){
                if(communityPanel)communityPanel.style.display="block";
                return;
            }
	
		if(navType==="hangkinh"){
    	const section=document.getElementById("hl-hangkinh-section");
    	if(section){
        section.scrollIntoView({
            behavior:"smooth",
            block:"center"
        });
        
	section.classList.add("hl-card-focus");
        setTimeout(()=>section.classList.remove("hl-card-focus"),1200);
    }
    	return;
}
            if(navType==="personal"){
                if(personalPanel)personalPanel.style.display="block";
          }
     });
}

   document.addEventListener("click",async function(event){
        const card=event.target.closest(".hl-nav-card");
        if(!card)return;
        const page=card.dataset.page;
	if(!page)return;
	event.stopPropagation();
        if(menuPanel)menuPanel.style.display="none";
        if(communityPanel)communityPanel.style.display="none";
        if(personalPanel)personalPanel.style.display="none";
        const target=document.querySelector('.hl-content-card[data-page="'+page+'"]');
        if(target){
		if(page==="lichsu"){
   		 await loadHistoryCard();
		}

		if(page==="danhnhan"){
     		await loadDanhNhanCard();
		}

		if(page==="danhthang"){
    		await loadDanhThangCard();
		}

		if(page==="amthuc"){
    		await loadAmThucCard();
		}

		if(page==="diadanh"){
    		await loadDiaDanhCard();
		}

		if(page==="hotoc"){
    		await loadHoTocCard();
		}

		if(page==="tulieu"){
    		await loadTuLieuCard();
		}

		if(page==="thongbao"){
        	await loadThongBaoCard();
		}

		if(page==="chuyenhangngay"){
    		await loadChuyenHangNgayCard();
		}

		if(page==="baiviet"){
		await loadBaiVietCard();
		}

		if(page==="thanhvien"){
		await loadThanhVienCard();
		}

	if(page==="gioithieu"){
  	  
   	 const introCard=document.getElementById("hl-card-gioithieu");
   	 if(introCard){
    	    introCard.click();
   	 }
   	 return;
	}
	target.scrollIntoView({
                behavior:"smooth",
                block:"center"
            });
            target.classList.add("hl-card-focus");
            setTimeout(()=>target.classList.remove("hl-card-focus"),1200);
        }else{
            console.warn("⚠️ KHÔNG TÌM THẤY CARD:",page);
        }
    });
	const historyCard=document.getElementById("hl-card-lichsu");
	if(historyCard){
    	historyCard.addEventListener("click",async function(event){
        if(event.target.closest(".hl-card-history-item"))return;
        event.stopPropagation();
        event.preventDefault();
        await loadHistoryCard();
    });
}

const danhNhanCard=document.getElementById("hl-card-danhnhan");
if(danhNhanCard){
    danhNhanCard.addEventListener("click",async function(event){
        if(event.target.closest(".hl-card-history-item"))return;
        await loadDanhNhanCard();
    });
}

const danhThangCard=document.getElementById("hl-card-danhthang");
if(danhThangCard){
    danhThangCard.addEventListener("click",async function(event){
        if(event.target.closest(".hl-card-history-item"))return;
        await loadDanhThangCard();
    });
}

const amThucCard=document.getElementById("hl-card-amthuc");
if(amThucCard){
    amThucCard.addEventListener("click",async function(event){
        if(event.target.closest(".hl-card-history-item"))return;
        await loadAmThucCard();
    });
}

const diaDanhCard=document.getElementById("hl-card-diadanh");
if(diaDanhCard){
    diaDanhCard.addEventListener("click",async function(event){
        if(event.target.closest(".hl-card-history-item"))return;
        await loadDiaDanhCard();
    });
}

const HoTocCard=document.getElementById("hl-card-hotoc");
if(HoTocCard){
    HoTocCard.addEventListener("click",async function(event){
        if(event.target.closest(".hl-card-history-item"))return;
        await loadHoTocCard();
    });
}

const TuLieuCard=document.getElementById("hl-card-tulieu");
if(TuLieuCard){
    TuLieuCard.addEventListener("click",async function(event){
        if(event.target.closest(".hl-card-history-item"))return;
        await loadTuLieuCard();
    });
}

const ThongBaoCard=document.getElementById("hl-card-thongbao");
if(ThongBaoCard){
    ThongBaoCard.addEventListener("click",async function(event){
        if(event.target.closest(".hl-card-history-item"))return;
        await loadThongBaoCard();
    });
}

const ChuyenHangNgayCard=document.getElementById("hl-card-chuyenhangngay");
if(ChuyenHangNgayCard){
    ChuyenHangNgayCard.addEventListener("click",async function(event){
        if(event.target.closest(".hl-card-history-item"))return;
        await loadChuyenHangNgayCard();
    });
}

const BaiVietCard=document.getElementById("hl-card-baiviet");
if(BaiVietCard){
    BaiVietCard.addEventListener("click",async function(event){
        if(event.target.closest(".hl-card-history-item"))return;
        await loadBaiVietCard();
    });
}

const ThanhVienCard=document.getElementById("hl-card-thanhvien");
if(ThanhVienCard){
    ThanhVienCard.addEventListener("click",async function(event){
        if(event.target.closest(".hl-card-history-item"))return;
        await loadThanhVienCard();
    });
}


const guiBaiSection=document.querySelector(".hl-guibai-section");
if(guiBaiSection){
    const submitButton=guiBaiSection.querySelector(".hl-guibai-submit");
    if(submitButton){
        submitButton.addEventListener("click",function(event){
            event.stopPropagation();

            const inputs=guiBaiSection.querySelectorAll("input");
            const textarea=guiBaiSection.querySelector("textarea");

            const hoTen=inputs[0]?.value.trim()||"";
            const lienHe=inputs[1]?.value.trim()||"";
            const noiO=inputs[2]?.value.trim()||"";
            const noiDung=textarea?.value.trim()||"";

            const subject="Đóng góp Bài viết / Kỷ vật Hiền Lương";
            const body=
                "Họ và tên: "+hoTen+"\n"+
                "Số điện thoại / Zalo: "+lienHe+"\n"+
                "Chi hội Hàng Kỉnh / Nơi ở: "+noiO+"\n\n"+
                "Nội dung đóng góp:\n"+noiDung;

            const gmailUrl="https://mail.google.com/mail/?view=cm&fs=1&to=langrenhienluong@gmail.com&su="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body);
            window.open(gmailUrl,"_blank");
        });
    }
}

const introCard=document.getElementById("hl-card-gioithieu");
if(introCard){
    introCard.addEventListener("click",async function(event){
        if(event.target.closest(".hl-card-arrow"))return;
        const cardRow=introCard.closest(".hl-card-row");
        if(!cardRow)return;
        if(activeQueHuongPanel){
            activeQueHuongPanel.remove();
            activeQueHuongPanel=null;
        }

        const panel=document.createElement("div");
        panel.className="hl-quehuong-inline-panel";
        panel.innerHTML=`
            <div class="hl-quehuong-inline-header">
                <div>
                    <span class="hl-quehuong-inline-label">QUÊ HƯƠNG</span>
                    <h3>Giới thiệu Hiền Lương</h3>
                </div>
                <button type="button" class="hl-quehuong-inline-close">×</button>
            </div>
            <div class="hl-quehuong-inline-activities">
                <div class="hl-card-list-loading">⏳ Đang tải...</div>
            </div>
        `;

        cardRow.insertAdjacentElement("afterend",panel);
        activeQueHuongPanel=panel;
        panel.scrollIntoView({behavior:"smooth",block:"nearest"});

        const listBox=panel.querySelector(".hl-quehuong-inline-activities");
        const closeButton=panel.querySelector(".hl-quehuong-inline-close");

        closeButton.addEventListener("click",function(){
            panel.remove();
            if(activeQueHuongPanel===panel)activeQueHuongPanel=null;
        });

        const module=await loadModule("gioithieu");
	if(!module||typeof module.renderItemInline!=="function"){
            listBox.innerHTML='<div class="hl-card-list-empty">Chưa có dữ liệu giới thiệu.</div>';
            return;
        }
       
	await module.renderItemInline(listBox);
    });
}

const thuocPhimList=document.getElementById("hl-thuocphim-list");
if(thuocPhimList){
    const loadThuocPhimList=async function(){
        const module=await loadModule("nhac");
        if(!module||typeof module.getList!=="function"){
            thuocPhimList.innerHTML='<div class="hl-card-list-empty">Chưa có danh sách thước phim.</div>';
            return;
        }
        const list=await module.getList();
        if(!list.length){
            thuocPhimList.innerHTML='<div class="hl-card-list-empty">Chưa có thước phim.</div>';
            return;
        }
        thuocPhimList.innerHTML=list.map((item,index)=>`
            <button type="button" class="hl-quehuong-inline-item" data-thuocphim-id="${item.id}">
                <span class="hl-quehuong-inline-year">${String(index+1).padStart(2,"0")}</span>
                <span class="hl-quehuong-inline-title">${item.title||"Thước phim Hiền Lương"}</span>
                <span class="hl-quehuong-inline-arrow">▶</span>
            </button>
        `).join("");
    };
    	loadThuocPhimList();
	thuocPhimList.addEventListener("click",function(event){
    	const item=event.target.closest(".hl-quehuong-inline-item");
    	if(!item)return;
    	const id=item.dataset.thuocphimId;
    	if(!id)return;
    	const loadPlayer=async function(){
        const module=await loadModule("nhac");
        if(!module||typeof module.getList!=="function")return;
        const list=await module.getList();
        const film=list.find(x=>x.id===id);
        if(!film)return;
        const player=document.getElementById("hl-thuocphim-player");
        if(!player)return;
        let html="";
        if(film.media_type==="youtube"&&film.link){
            let videoId="";
            try{
                const url=new URL(film.link);
                if(url.hostname.includes("youtu.be"))videoId=url.pathname.substring(1);
                if(url.hostname.includes("youtube.com"))videoId=url.searchParams.get("v")||"";
            }catch(error){}
            if(videoId)html=`<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" title="${film.title||"Thước phim Hiền Lương"}" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
        }else if(film.media_type==="mp4"&&film.link){
            html=`<video src="${film.link}" controls autoplay playsinline></video>`;
        }
        if(!html){
            player.innerHTML=`<div class="hl-thuocphim-tv-placeholder"><span>⚠️</span><strong>KHÔNG PHÁT ĐƯỢC THƯỚC PHIM</strong></div>`;
            return;
        }
        player.innerHTML=html;
    };
    loadPlayer();
});
}
}
//======================================================
// LOAD NEW NAVIGATION PAGE
//======================================================

async function loadNewNavigationPage(page){
    showLoading();

    try{
        const module=await loadModule(page);
        if(!module){
            showError();
            return;
        }

        CURRENT_PAGE=page;

        if(typeof module.renderMain==="function"){
            await module.renderMain();
            hideBackground();
            if(isMobile())hideMobileColumns();
            return;
        }

        if(!isMobile()&&typeof module.initThumbnail==="function"){
    await module.initThumbnail();
}

        if(typeof module.menuClick==="function"){
            await module.menuClick();
            hideBackground();
            if(isMobile())hideMobileColumns();
            return;
        }

        console.warn("⚠️ MODULE KHÔNG CÓ HÀM XỬ LÝ:",page);
    }
    catch(error){
        console.error("❌ NEW NAVIGATION ERROR:",page,error);
        showError();
    }
}
//======================================================
// HANDLE LEFT MENU
//======================================================

async function handleLeftMenu(
    page,
    menu
) {
    showLoading();
    try {
        const module = await loadModule(page);
        if (!module) {
            showError();
            return;
        }

        if (
            typeof module.menuClick ===
            "function"
        ) {
            if (
                typeof module.initThumbnail ===
                "function"
            ) {
                await module.initThumbnail();
                            }
            await module.menuClick();
            hideBackground();
            if (isMobile()) {
                hideMobileColumns();
            }
            return;
        }

        //================================================
        // GIỚI THIỆU
        // Không có menuClick()
        // → renderMain() như cơ chế cũ.
        //================================================

        if (
            typeof module.renderMain ===
            "function"
        ) {
            await module.renderMain();
            hideBackground();
            if (isMobile()) {
                hideMobileColumns();
            }
            return;
        }
        console.warn("⚠️ MODULE KHÔNG CÓ HÀM XỬ LÝ:",page);
    }
    catch(error) {
        console.error("❌ LEFT MENU ERROR:",page,error);
        showError();
    }
}

//======================================================
// HANDLE RIGHT MENU
//======================================================

async function handleRightMenu(page) {
    showLoading();
    try {
        const module = await loadModule(page);
        if (!module) {
            showError();
            return;
        }

        if (
            typeof module.initThumbnail ===
            "function"
        ) {

            await module.initThumbnail();
        }
        if (
            typeof module.renderMain ===
            "function"
        ) {
            await module.renderMain();
if(isMobile()){
    hideMobileColumns();
    document.getElementById("hl-content")?.scrollIntoView({
        behavior:"smooth",
        block:"start"
    });
}
            hideBackground();
            if (isMobile()) {
                hideMobileColumns();
            }
            return;
        }
        console.warn("⚠️ RIGHT MODULE KHÔNG CÓ renderMain():",page);
    }
    catch(error) {
        console.error("❌ RIGHT MENU ERROR:",page,error);
        showError();
    }
}

//======================================================
// SHOW LOADING
//======================================================

function showLoading() {
    const box =document.getElementById("hl-content");
    if (!box) {
        return;
    }
    box.innerHTML ='<div class="hl-loading">' +'Đang tải dữ liệu...' +'</div>';
}

//======================================================
// SHOW ERROR
//======================================================

function showError() {
    const box = document.getElementById("hl-content");
    if (!box) {
        return;
    }
    box.innerHTML ='<div class="hl-error">' +'Không thể tải dữ liệu.' +'</div>';
}

//======================================================
// MOBILE TAP
//======================================================

function bindMobileToggle() {

    document.addEventListener(
        "click",
        function(event) {
            if (!isMobile()) {
    mobileCategoryPanel.style.display =
        "none";
    return;
}
//======================================================
// MOBILE PANEL - TỰ ĐÓNG KHI CHUYỂN SANG PC
//======================================================

window.addEventListener(
    "resize",
    function() {

        if (!isMobile()) {

            if (mobileCategoryPanel) {

                mobileCategoryPanel.style.display =
                    "none";

            }

        }

    }
);

            //==========================================
            // CLICK MENU
            //==========================================

            if (
                event.target.closest(
                    ".hl-left .hl-menu, .hl-right .hl-menu"
                )
            ) {

                return;
            }

            //==========================================
            // PHẦN TỬ TƯƠNG TÁC
            //==========================================

            if (
                event.target.closest(
                    "a, button, input, textarea, select, video, iframe, audio"
                )
            ) {

                return;
            }

            //==========================================
            // WEBSITE MAIN
            //==========================================

            const main = document.querySelector(".hl-main");
           if (!main) {
                return;
            }
            if (
                !main.contains(
                    event.target
                )
            ) {
                return;
            }
            toggleMobileColumns();
        }
    );
}

//======================================================
// MOBILE CHECK
//======================================================

function isMobile() {

    return window.matchMedia("(max-width: 900px)").matches;
}

//======================================================
// HIDE MOBILE COLUMNS
//======================================================

function hideMobileColumns() {
    const main = document.querySelector(".hl-main");
    if (!main) return;
    main.classList.add("mobile-columns-hidden");
}

//======================================================
// SHOW MOBILE COLUMNS
//======================================================

function showMobileColumns() {
    const main = document.querySelector(".hl-main");
    if (!main) {
        return;
    }
    main.classList.remove("mobile-columns-hidden");
}

//======================================================
// TOGGLE MOBILE COLUMNS
//======================================================

function toggleMobileColumns() {
    const main = document.querySelector(".hl-main");
    if (!main) {
        return;
    }
    main.classList.toggle("mobile-columns-hidden");
}

//======================================================
// LOAD PAGE
//======================================================

async function loadPage(page) {
    CURRENT_PAGE = page;
    try {
        const module = await loadModule(page);
        if (
            module &&
            typeof module.renderMain ===
            "function"
        ) {
            await module.renderMain();
            hideBackground();
            if (isMobile()) {
                hideMobileColumns();
            }
        }
    }
    catch(error) {
        console.error("❌ LOAD PAGE ERROR:",page,error);
        showError();
    }
}

//======================================================
// HIDE BACKGROUND
//======================================================

function hideBackground() {
    const bg = document.getElementById("bg-main");
    if (bg) {
        bg.style.display = "none";
    }
}

//======================================================
// SHOW BACKGROUND
//======================================================

function showBackground() {

    const bg = document.getElementById("bg-main");
    if (bg) {
        bg.style.display = "";
    }
}

//======================================================
// THEME SWITCHER
//======================================================

const themeButton = document.getElementById("btn-theme");
const themeSwitcher = document.querySelector(".hl-theme-switcher");
const themeMenu = document.getElementById("theme-menu");

if (themeButton && themeSwitcher && themeMenu) {

    // Mở / đóng menu
    themeButton.addEventListener("click", (event) => {
        event.stopPropagation();
        themeSwitcher.classList.toggle("open");
    });

    // Chọn theme
    themeMenu.querySelectorAll("[data-theme]").forEach(button => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            const theme = button.dataset.theme;

   // Theme Engine của index.css dùng documentElement
            document.documentElement.dataset.theme = theme;
            themeSwitcher.classList.remove("open");
        });
    });

    // Click ra ngoài thì đóng menu
    document.addEventListener("click", () => {
        themeSwitcher.classList.remove("open");
    });
}

//======================================================
// MOBILE MENU - BƯỚC 5.2
//======================================================

const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");
const mobileMenuOverlay = document.getElementById("mobile-menu-overlay");
const mobileMenuItems = document.querySelectorAll(".mobile-menu-item");

document.addEventListener("click",function(event){}, true);

//======================================================
// MOBILE - SAU KHI CHỌN NỘI DUNG → ẨN CỘT MENU
//======================================================

document.addEventListener(
    "click",
    function(event) {

        if (!isMobile()) {
            return;
        }
        if (
            !event.target.closest(".hl-history-row")
        ) {
            return;
        }
        setTimeout(
            function() {

                hideMobileColumns();
            },
            0
        );
    },
    true
);
//======================================================
// MỞ / ĐÓNG MENU
//======================================================

function closeMobileMenu() {
    document.body.classList.remove("mobile-menu-open");
}

// Nút ☰
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        document.body.classList.toggle("mobile-menu-open");
    });
}


// Click nền tối → đóng
if (mobileMenuOverlay) {
    mobileMenuOverlay.addEventListener("click", () => {
        closeMobileMenu();
    });
}
mobileMenu.addEventListener(
    "click",
    async (event) => {
     

const contentRows = [
    ".hl-history-row",
    ".hl-danhnhan-row",
    ".hl-amthuc-row",
    ".hl-danhthang-row",
    ".hl-diadanh-row",
    ".hl-hotoc-row",
    ".hl-tulieu-row",
    ".hl-thongbao-row"
];

const clickedRow = contentRows.some(selector => event.target.closest(selector));
if(clickedRow){
    if(isMobile()){
        setTimeout(function(){
            hideMobileColumns();
            closeMobileMenu();
        }, 0);
    }
    return;
}
        const item = event.target.closest(".mobile-menu-item");
        if (!item) {
            return;
        }
        event.stopPropagation();
        const page = item.dataset.page;
        if (!page) {
            return;
        }

        //==========================================
        // LEFT MENU
        //==========================================

        const leftPages = [
            "gioithieu",
            "lichsu",
	    "danhnhan",
            "danhthang",
            "amthuc",
            "diadanh",
            "hotoc",
            "tulieu",
	    "thongbao"
        ];
        if (leftPages.includes(page)) {
    try {
        const module = await loadModule(page);
        if (!module) {
            return;
        }

        //==================================================
        // GIỚI THIỆU - LOAD THẲNG NỘI DUNG
        //==================================================

        if (page === "gioithieu") {

            if (
                typeof module.renderMain ===
                "function"
            ) {
                await module.renderMain();

            }

            hideMobileColumns();
            closeMobileMenu();
            CURRENT_PAGE = page;
                        return;
        }

        //==================================================
        // CÁC MỤC CÓ DANH SÁCH
        //==================================================

        if (
            typeof module.initThumbnail ===
            "function"
        ) {
            await module.initThumbnail();

        }
        if (
            typeof module.menuClick ===
            "function"
        ) {
            await module.menuClick();
        }

        CURRENT_PAGE = page;
    }
    catch (error) {
        console.error("❌ MOBILE LEFT MENU ERROR:",page,error);
    }
    return;
}

        //==========================================
        // RIGHT MENU
        //==========================================

        const rightPages = ["chuyenhangngay","baiviet","thanhvien"];
        if (rightPages.includes(page)) {
            try {
                await handleRightMenu(page);
                closeMobileMenu();
                CURRENT_PAGE = page;
            }
            catch (error) {
                console.error("❌ MOBILE RIGHT MENU ERROR:",page, error);
            }
        }
    },
    true
);

//======================================================
// MOBILE BOTTOM - DANH MỤC
//======================================================

const mobileBottomCategory = document.getElementById("mobile-bottom-category");
const mobileCategoryPanel = document.getElementById("mobile-category-panel");

//======================================================
// MOBILE BOTTOM - CATEGORY ITEM
//======================================================

if(mobileCategoryPanel){
    mobileCategoryPanel.addEventListener("click",async function(event){
        const item=event.target.closest(".mobile-panel-item");
        if(!item)return;
        event.stopPropagation();

        const page=item.dataset.page;
        if(!page)return;

        try{
            const cardMap={
                gioithieu:"hl-card-gioithieu",
                lichsu:"hl-card-lichsu",
                danhnhan:"hl-card-danhnhan",
                danhthang:"hl-card-danhthang",
                amthuc:"hl-card-amthuc",
                diadanh:"hl-card-diadanh",
                hotoc:"hl-card-hotoc",
                tulieu:"hl-card-tulieu",
                thongbao:"hl-card-thongbao"
            };

            const cardId=cardMap[page];
            const card=document.getElementById(cardId);

            if(!card){
                console.warn("⚠️ KHÔNG TÌM THẤY CARD MOBILE:",page);
                return;
            }

            mobileCategoryPanel.style.display="none";

            const mobileCategoryList=document.getElementById("mobile-category-list");
            if(mobileCategoryList){
                mobileCategoryList.style.display="none";
            }
	    
            card.click();
            CURRENT_PAGE=page;
        }
        catch(error){
            console.error("❌ MOBILE CATEGORY ERROR:",page,error);
        }
    });
}

//======================================================
// MOBILE BOTTOM - CỘNG ĐỒNG + CÁ NHÂN
//======================================================

const mobileCategoryList=document.getElementById("mobile-category-list");
const mobileCommunityPanel=document.getElementById("mobile-community-panel");
const mobilePersonalPanel=document.getElementById("mobile-personal-panel");

//======================================================
// MOBILE BOTTOM - 4 NÚT
//======================================================

document.addEventListener("click",function(event){
    const button=event.target.closest("#mobile-bottom-nav .mobile-bottom-item");
    if(!button)return;

    event.stopPropagation();

    const page=button.dataset.page;

    if(page==="home"){
    if(mobileCategoryPanel)mobileCategoryPanel.style.display="none";
    if(mobileCategoryList)mobileCategoryList.style.display="none";
    if(mobileCommunityPanel)mobileCommunityPanel.style.display="none";
    if(mobilePersonalPanel)mobilePersonalPanel.style.display="none";

    const main=document.querySelector(".hl-main");
    if(main)main.classList.remove("mobile-columns-hidden");

    const content=document.getElementById("hl-content");
    if(content)content.innerHTML="";
    loadVinhDanhTienHien();
    const bgMain=document.getElementById("bg-main");
    if(bgMain)bgMain.style.display="";

    CURRENT_PAGE="";
    
    return;
}

    if(page==="danhmuc"){
        if(mobileCommunityPanel)mobileCommunityPanel.style.display="none";
        if(mobilePersonalPanel)mobilePersonalPanel.style.display="none";

        if(mobileCategoryPanel){
            const isOpen=mobileCategoryPanel.style.display==="block";
            mobileCategoryPanel.style.display=isOpen?"none":"block";
        }

        
        return;
    }

    if(page==="congdong"){
        if(mobileCategoryPanel)mobileCategoryPanel.style.display="none";
        if(mobileCategoryList)mobileCategoryList.style.display="none";
        if(mobilePersonalPanel)mobilePersonalPanel.style.display="none";

        if(mobileCommunityPanel){
            const isOpen=mobileCommunityPanel.style.display==="block";
            mobileCommunityPanel.style.display=isOpen?"none":"block";
        }

        
        return;
    }

    if(page==="canhan"){
        if(mobileCategoryPanel)mobileCategoryPanel.style.display="none";
        if(mobileCategoryList)mobileCategoryList.style.display="none";
        if(mobileCommunityPanel)mobileCommunityPanel.style.display="none";

        if(mobilePersonalPanel){
            const isOpen=mobilePersonalPanel.style.display==="block";
            mobilePersonalPanel.style.display=isOpen?"none":"block";
        }

        
    }
});

//======================================================
// CLICK ITEM CỘNG ĐỒNG
//======================================================

if (mobileCommunityPanel) {

    mobileCommunityPanel.addEventListener(
        "click",
        async function(event) {

            const item =
                event.target.closest(
                    ".mobile-panel-item"
                );

            if (!item) {
                return;
            }

            const page =
                item.dataset.page;

            if (!page) {
                return;
            }

            try {
    

    if(page==="chuyenhangngay"){
        await loadChuyenHangNgayCard();
    }

	if(page==="baiviet"){
    await loadBaiVietCard();
	}

	if(page==="thanhvien"){
    await loadThanhVienCard();
	}

    mobileCommunityPanel.style.display="none";
    CURRENT_PAGE=page;
}
catch(error){
    console.error("❌ COMMUNITY ITEM ERROR:",page,error);
}

        }
    );

}


//======================================================
// CLICK ITEM TRONG PANEL CÁ NHÂN
//======================================================

if (mobilePersonalPanel) {

    mobilePersonalPanel.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();

            const item =
                event.target.closest(
                    ".mobile-panel-item"
                );

            if (!item) {
                return;
            }

            const action =
                item.dataset.action;

               //==================================================
            // ĐĂNG NHẬP
            //==================================================

            if (action === "login") {

                window.location.href =
                    "./customers/tab/userlogin.html";

                return;

            }

            //==================================================
            // ĐĂNG KÝ
            //==================================================

            if (action === "register") {

                window.location.href =
                    "./customers/tab/userregister.html";

                return;

            }

        }
    );

}