
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

const mobileBottomCategory =
    document.getElementById("mobile-bottom-category");

const mobileCategoryPanel =
    document.getElementById("mobile-category-panel");


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

            console.log(
                isOpen
                    ? "📚 DANH MỤC → ĐÓNG"
                    : "📚 DANH MỤC → MỞ"
            );

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

            console.log(
                "📚 BOTTOM CATEGORY →",
                page
            );

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

                    CURRENT_PAGE = page;

                    console.log(
                        "📘 BOTTOM → GIỚI THIỆU → MAIN"
                    );

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

                    console.warn(
                        "⚠️ KHÔNG TÌM THẤY mobile-category-list"
                    );

                    return;
                }


                listBox.innerHTML = "";


                //==================================================
                // LỊCH SỬ + DANH THẮNG
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

                        console.warn(
                            "⚠️ KHÔNG TÌM THẤY MENU:",
                            page
                        );

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
                    // LẤY LIST
                    //================================================

                    const originalList =
                        menu.querySelector(
                            listClass
                        );

                    if (!originalList) {

                        console.warn(
                            "⚠️ KHÔNG TẠO ĐƯỢC LIST:",
                            page
                        );

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


                                    console.log(
                                        "📖 BOTTOM → CLICK:",
                                        page,
                                        id
                                    );


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


                                    console.log(
                                        "📖 BOTTOM → LOAD MAIN:",
                                        page,
                                        id
                                    );

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


                    console.log(
                        "✅ BOTTOM → LIST ĐÃ HIỆN:",
                        page,
                        rows.length,
                        "MỤC"
                    );


                    return;
                }


                //==================================================
                // MODULE KHÁC CHƯA NỐI
                //==================================================

                console.log(
                    "⏳ BOTTOM → MODULE LIST CHƯA NỐI:",
                    page
                );

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

            console.log(
                "🏠 BOTTOM → TRANG CHỦ"
            );

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

            console.log(
                "📰 BOTTOM COMMUNITY →",
                page
            );

            try {

                await handleRightMenu(page);

                mobileCommunityPanel.style.display =
                    "none";

                CURRENT_PAGE = page;

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

            // Đóng Danh mục
            if (mobileCategoryPanel) {
                mobileCategoryPanel.style.display =
                    "none";
            }

            if (mobileCategoryList) {
                mobileCategoryList.style.display =
                    "none";
            }

            // Đóng Cá nhân
            if (mobilePersonalPanel) {
                mobilePersonalPanel.style.display =
                    "none";
            }

            // Toggle Cộng đồng
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

if (mobilePersonalPanel) {

    mobilePersonalPanel.addEventListener(
        "click",
        function(event) {

            const item =
                event.target.closest(
                    ".mobile-panel-item"
                );

            if (!item) {
                return;
            }

            const action =
                item.dataset.action;

            console.log(
                "👤 BOTTOM PERSONAL →",
                action
            );

            if (action === "login") {

                window.location.href =
                    "customers/tab/userlogin.html";

                return;
            }

            if (action === "register") {

                window.location.href =
                    "customers/tab/userregister.html";

                return;
            }

        }
    );

}
//======================================================
// CÁ NHÂN
//======================================================

if (mobileBottomPersonal) {

    mobileBottomPersonal.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();

            // Đóng Danh mục
            if (mobileCategoryPanel) {
                mobileCategoryPanel.style.display =
                    "none";
            }

            if (mobileCategoryList) {
                mobileCategoryList.style.display =
                    "none";
            }

            // Đóng Cộng đồng
            if (mobileCommunityPanel) {
                mobileCommunityPanel.style.display =
                    "none";
            }

            // Toggle Cá nhân
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