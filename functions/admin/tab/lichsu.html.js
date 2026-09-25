export async function onRequest(context) {

    //======================================================
    // 1. LẤY FIREBASE ID TOKEN TỪ COOKIE
    //======================================================

    const cookie =
        context.request.headers.get("Cookie") || "";

    const match =
        cookie.match(/hl_admin_token=([^;]+)/);

    if (!match) {

        return new Response(
            `
            <h1>🔒 KHÔNG CÓ QUYỀN TRUY CẬP</h1>
            <p>Chưa đăng nhập Admin.</p>
            `,
            {
                status: 403,
                headers: {
                    "Content-Type": "text/html; charset=UTF-8"
                }
            }
        );
    }

    const token =
        decodeURIComponent(match[1]);


    //======================================================
    // 2. GỌI WORKER XÁC MINH TOKEN + QUYỀN
    //======================================================

    const verifyResponse =
        await fetch(
            "https://hienluong-auth-test.jonemac1975.workers.dev/auth/verify-admin",
            {
                method: "GET",
                headers: {
                    "Authorization":
                        "Bearer " + token
                }
            }
        );


    //======================================================
    // 3. TOKEN KHÔNG HỢP LỆ
    //======================================================

    if (!verifyResponse.ok) {

        return new Response(
            `
            <h1>🔒 KHÔNG CÓ QUYỀN TRUY CẬP</h1>
            <p>Token Admin không hợp lệ hoặc đã hết hạn.</p>
            `,
            {
                status: 403,
                headers: {
                    "Content-Type": "text/html; charset=UTF-8"
                }
            }
        );
    }


    const result =
        await verifyResponse.json();


    //======================================================
    // 4. KIỂM TRA QUYỀN LỊCH SỬ
    //======================================================

    const allowed =
        result.admin === true &&
        (
            result.role === "superadmin" ||
            result.permissions?.lichsu === true
        );


    if (!allowed) {

        return new Response(
            `
            <h1>🔒 KHÔNG CÓ QUYỀN TRUY CẬP</h1>
            <p>Tài khoản của anh chưa được cấp quyền cho chức năng này.</p>
            `,
            {
                status: 403,
                headers: {
                    "Content-Type": "text/html; charset=UTF-8"
                }
            }
        );
    }


    //======================================================
    // 5. CÓ QUYỀN → TRẢ FILE LỊCH SỬ
    //======================================================

    const assetURL =
        new URL(
            "/admin/tab/lichsu.html",
            context.request.url
        );

    return context.env.ASSETS.fetch(assetURL);
}