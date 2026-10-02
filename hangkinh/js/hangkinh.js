//======================================================
// HIENLUONG WEBSITE
// File : /hangkinh/js/hangkinh.js
// Trang cập nhật hoạt động Hàng Kỉnh
//======================================================

const params=new URLSearchParams(window.location.search);
const HANG_KINH_ID=params.get("id")||"";
const HANG_KINH_USER=params.get("user")||"";

//======================================================
// INIT
//======================================================

function init(){
    document.getElementById("hk-id").value=HANG_KINH_ID;
    document.getElementById("hk-user").value=HANG_KINH_USER;

    document.getElementById("hk-home")?.addEventListener("click",()=>{
        window.location.href="/";
    });

    document.getElementById("hk-update")?.addEventListener("click",()=>{
    window.location.href=`/hangkinh/tab/hangkinhupdate.html?id=${encodeURIComponent(HANG_KINH_ID)}&user=${encodeURIComponent(HANG_KINH_USER)}`;
});
}

//======================================================

init();