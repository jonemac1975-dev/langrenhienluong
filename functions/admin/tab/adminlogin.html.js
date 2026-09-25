//======================================================
// HIENLUONG
// ADMIN LOGIN
// Cho phép mở trang đăng nhập
//======================================================

export async function onRequest(context) {

    const assetUrl =
        new URL(
            "/admin/tab/adminlogin.html",
            context.request.url
        );

    return context.env.ASSETS.fetch(assetUrl);
}