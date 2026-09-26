
import "./bgmain.js";

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

    // RIGHT
    chuyenhangngay: "./customers/chuyenhangngay.js",
    baiviet: "./customers/baiviet.js",
    thanhvien: "./customers/thanhvien.js"
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

//======================================================
// INIT
//
// QUAN TRỌNG:
// Không import module.
// Không gọi Firebase.
// Không khởi tạo thumbnail động.
//
// INDEX chỉ khởi tạo menu.
//======================================================

function init() {
    bindMenu();
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
            thumb.innerHTML =`<div class="tv-thumb-text">👥 DS thành viên </div>`;
        }
    );
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

    console.log("🎵 CHỌN BÀI NHẠC:",music);

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
	if(footerPlay)footerPlay.textContent="🎵 Đang phát";
const mobileMusic=document.getElementById("mobile-bottom-music");
if(mobileMusic)mobileMusic.innerHTML="<span>🎵</span><span>Đang phát</span>";
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

        //================================================
        // LEFT MODULE CÓ menuClick()
        //
        // Trước đây initThumbnail() đã chạy lúc INDEX mở.
        //
        // Bây giờ:
        // click menu
        //      ↓
        // import module
        //      ↓
        // initThumbnail()
        //      ↓
        // Firebase
        //      ↓
        // menuClick()
        // Nhờ vậy không cần sửa LIST
        // trong các module hiện tại.
        //================================================

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

        //================================================
        // RIGHT:
        //
        // click menu
        //      ↓
        // import module
        //      ↓
        // initThumbnail()
        //      ↓
        // renderMain()
        //      ↓
        // Firebase
        //      ↓
        // thumbnail + MAIN
        //================================================

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

        //==========================================
        // CLICK DÒNG LỊCH SỬ
        // Để lichsu.js tự xử lý
        //==========================================
        //======================================================
	// MOBILE - CLICK CÁC DÒNG DANH SÁCH
	//======================================================

const contentRows = [
    ".hl-history-row",
    ".hl-danhnhan-row",
    ".hl-amthuc-row",
    ".hl-danhthang-row",
    ".hl-diadanh-row",
    ".hl-hotoc-row",
    ".hl-tulieu-row"
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
            "tulieu"
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
if (
    mobileBottomCategory &&
    mobileCategoryPanel
) {

    mobileBottomCategory.addEventListener(
        "click",
        function(event) {
            event.stopPropagation();
            if (!isMobile()) {
                return;
            }

            const isOpen =
                mobileCategoryPanel.style.display ===
                "block";

            /* Đóng panel */

            mobileCategoryPanel.style.display =
                isOpen ? "none" : "block";
     
        }
    );
}


//======================================================
// MOBILE BOTTOM - CATEGORY ITEM
//======================================================

if (mobileCategoryPanel) {

    mobileCategoryPanel.addEventListener(
        "click",
        async function(event) {

            const item =
                event.target.closest(
                    ".mobile-panel-item"
                );

            if (!item) {
                return;
            }

            event.stopPropagation();

            const page =
                item.dataset.page;

            try {

                //==================================================
                // LOAD MODULE
                //==================================================

                const module =
                    await loadModule(page);

                if (!module) {
                    return;
                }


                //==================================================
                // GIỚI THIỆU → LOAD THẲNG MAIN
                //==================================================

                if (page === "gioithieu") {

                    if (
                        typeof module.renderMain ===
                        "function"
                    ) {

                        await module.renderMain();

                    }

                    mobileCategoryPanel.style.display =
                        "none";

                    if (mobileCategoryList) {

                        mobileCategoryList.style.display =
                            "none";

                    }

                    hideMobileColumns();

                    CURRENT_PAGE =
                        page;

                             return;

                }


                //==================================================
                // LOAD DATA
                //==================================================

                if (
                    typeof module.initThumbnail ===
                    "function"
                ) {

                    await module.initThumbnail();

                }


                //==================================================
                // LẤY KHU VỰC LIST
                //==================================================

                const listBox =
                    document.getElementById(
                        "mobile-category-list"
                    );

                if (!listBox) {
                    return;

                }

                listBox.innerHTML = "";


                //==================================================
                // CÁC MODULE CÓ DANH SÁCH
                //==================================================

                if (
                    page === "lichsu" ||
                    page === "danhnhan" ||
                    page === "danhthang" ||
                    page === "amthuc" ||
                    page === "diadanh" ||
                    page === "hotoc" ||
                    page === "tulieu"
                ) {

                    //================================================
                    // XÁC ĐỊNH MENU GỐC
                    //================================================

                    const menu =
                        document.querySelector(
                            '.mobile-menu-item[data-page="' +
                            page +
                            '"]'
                        );

                    if (!menu) {
                        
                        return;

                    }


                    //================================================
                    // XÁC ĐỊNH CLASS LIST
                    //================================================

                    const listClass =
                        page === "lichsu"
                            ? ".hl-history-menu"
                            : page === "danhnhan"
                                ? ".hl-danhnhan-menu"
                                : page === "danhthang"
                                    ? ".hl-danhthang-menu"
                                    : page === "amthuc"
                                        ? ".hl-amthuc-menu"
                                        : page === "diadanh"
                                            ? ".hl-diadanh-menu"
                                            : page === "hotoc"
                                                ? ".hl-hotoc-menu"
                                                : ".hl-tulieu-menu";


                    const rowClass =
                        page === "lichsu"
                            ? ".hl-history-row"
                            : page === "danhnhan"
                                ? ".hl-danhnhan-row"
                                : page === "danhthang"
                                    ? ".hl-danhthang-row"
                                    : page === "amthuc"
                                        ? ".hl-amthuc-row"
                                        : page === "diadanh"
                                            ? ".hl-diadanh-row"
                                            : page === "hotoc"
                                                ? ".hl-hotoc-row"
                                                : ".hl-tulieu-row";


                    //================================================
                    // XÓA LIST CŨ
                    //================================================

                    const oldList =
                        menu.querySelector(
                            listClass
                        );

                    if (oldList) {

                        oldList.remove();

                    }


                    //================================================
                    // TẠO LIST
                    //================================================

                    if (
                        typeof module.menuClick ===
                        "function"
                    ) {

                        await module.menuClick();

                    }


                    //================================================
                    // LẤY LIST GỐC
                    //================================================

                    const originalList =
                        menu.querySelector(
                            listClass
                        );

                    if (!originalList) {
                        
                        return;

                    }


                    //================================================
                    // LẤY ROW
                    //================================================

                    const rows =
                        originalList.querySelectorAll(
                            rowClass
                        );


                    //================================================
                    // COPY ROW SANG LIST MOBILE
                    //================================================

                    rows.forEach(
                        function(row) {

                            const clone =
                                row.cloneNode(true);

                            listBox.appendChild(
                                clone
                            );


                            //========================================
                            // CLICK ROW
                            //========================================

                            clone.addEventListener(
                                "click",
                                function(event) {

                                    event.stopPropagation();

                                    const id =
                                        this.dataset.id;

                                    //================================
                                    // TÌM ROW GỐC
                                    //================================

                                    const originalRow =
                                        originalList.querySelector(
                                            rowClass +
                                            '[data-id="' +
                                            id +
                                            '"]'
                                        );


                                    //================================
                                    // CLICK ROW GỐC
                                    // MODULE SẼ LOAD MAIN
                                    //================================

                                    if (originalRow) {

                                        originalRow.click();

                                    }


                                    //================================
                                    // ĐÓNG LIST + PANEL
                                    //================================

                                    listBox.style.display =
                                        "none";

                                    mobileCategoryPanel.style.display =
                                        "none";

                                    hideMobileColumns();

                                    CURRENT_PAGE =
                                        page;
                          
                                }
                            );

                        }
                    );


                    //================================================
                    // HIỆN LIST
                    //================================================

                    listBox.style.display =
                        "block";

                    mobileCategoryPanel.style.display =
                        "none";

                             return;

                }


                //==================================================
                // MODULE KHÁC CHƯA NỐI
                //==================================================

            }
            catch (error) {

                console.error(
                    "❌ BOTTOM CATEGORY ERROR:",
                    page,
                    error
                );

            }

        }
    );

}


//======================================================
// MOBILE BOTTOM - CỘNG ĐỒNG + CÁ NHÂN
//======================================================


const mobileCategoryList =
    document.getElementById(
        "mobile-category-list"
    );

const mobileCommunityPanel =
    document.getElementById(
        "mobile-community-panel"
    );

const mobilePersonalPanel =
    document.getElementById(
        "mobile-personal-panel"
    );

const mobileBottomHome =
    document.querySelector(
        '.mobile-bottom-item[data-page="home"]'
    );

if (mobileBottomHome) {

    mobileBottomHome.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();
     
            // Đóng các panel mobile
            if (mobileCategoryPanel) {
                mobileCategoryPanel.style.display =
                    "none";
            }

            if (mobileCategoryList) {
                mobileCategoryList.style.display =
                    "none";
            }

            if (mobileCommunityPanel) {
                mobileCommunityPanel.style.display =
                    "none";
            }

            if (mobilePersonalPanel) {
                mobilePersonalPanel.style.display =
                    "none";
            }

            // Hiện lại 3 cột
            const main =
                document.querySelector(".hl-main");

            if (main) {
                main.classList.remove(
                    "mobile-columns-hidden"
                );
            }

            // Hiện background
            const bgMain =
                document.getElementById("bg-main");

            if (bgMain) {
                bgMain.style.display = "";
            }

            CURRENT_PAGE = "";

        }
    );
}

const mobileBottomCommunity =
    document.querySelector(
        '.mobile-bottom-item[data-page="congdong"]'
    );

const mobileBottomPersonal =
    document.querySelector(
        '.mobile-bottom-item[data-page="canhan"]'
    );

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

                await handleRightMenu(page);

                mobileCommunityPanel.style.display =
                    "none";

                CURRENT_PAGE =
                    page;

            }
            catch (error) {

                console.error(
                    "❌ COMMUNITY ITEM ERROR:",
                    page,
                    error
                );

            }

        }
    );

}
//======================================================
// CỘNG ĐỒNG
//======================================================

if (mobileBottomCommunity) {

    mobileBottomCommunity.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();

            //==================================================
            // ĐÓNG DANH MỤC
            //==================================================

            if (mobileCategoryPanel) {

                mobileCategoryPanel.style.display =
                    "none";

            }

            if (mobileCategoryList) {

                mobileCategoryList.style.display =
                    "none";

            }


            //==================================================
            // ĐÓNG CÁ NHÂN
            //==================================================

            if (mobilePersonalPanel) {

                mobilePersonalPanel.style.display =
                    "none";

            }


            //==================================================
            // TOGGLE CỘNG ĐỒNG
            //==================================================

            if (mobileCommunityPanel) {

                if (
                    mobileCommunityPanel.style.display ===
                    "block"
                ) {

                    mobileCommunityPanel.style.display =
                        "none";

                }
                else {

                    mobileCommunityPanel.style.display =
                        "block";

                }

            }

        }
    );

}
//======================================================
// CLICK ITEM CÁ NHÂN
//======================================================

if (mobileBottomPersonal) {

    mobileBottomPersonal.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();


            //==================================================
            // ĐÓNG DANH MỤC
            //==================================================

            if (mobileCategoryPanel) {

                mobileCategoryPanel.style.display =
                    "none";

            }

            if (mobileCategoryList) {

                mobileCategoryList.style.display =
                    "none";

            }


            //==================================================
            // ĐÓNG CỘNG ĐỒNG
            //==================================================

            if (mobileCommunityPanel) {

                mobileCommunityPanel.style.display =
                    "none";

            }


            //==================================================
            // TOGGLE CÁ NHÂN
            //==================================================

            if (mobilePersonalPanel) {

                if (
                    mobilePersonalPanel.style.display ===
                    "block"
                ) {

                    mobilePersonalPanel.style.display =
                        "none";

                }
                else {

                    mobilePersonalPanel.style.display =
                        "block";

                }

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