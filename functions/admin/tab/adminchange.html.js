//======================================================
// HIENLUONG WEBSITE
// File : functions/admin/tab/adminchange.html.js
//======================================================

export async function onRequest(context) {

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
                    "Content-Type":
                        "text/html; charset=UTF-8"
                }
            }
        );
    }

    const token =
        decodeURIComponent(match[1]);

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

    if (!verifyResponse.ok) {
        return new Response(
            `
            <h1>🔒 KHÔNG CÓ QUYỀN TRUY CẬP</h1>
            <p>Token Admin không hợp lệ hoặc đã hết hạn.</p>
            `,
            {
                status: 403,
                headers: {
                    "Content-Type":
                        "text/html; charset=UTF-8"
                }
            }
        );
    }

    const result =
        await verifyResponse.json();

    if (result.admin !== true) {
        return new Response(
            `
            <h1>🔒 KHÔNG CÓ QUYỀN TRUY CẬP</h1>
            <p>Tài khoản này không có quyền Admin.</p>
            `,
            {
                status: 403,
                headers: {
                    "Content-Type":
                        "text/html; charset=UTF-8"
                }
            }
        );
    }

    const assetURL =
        new URL(
            "/admin/tab/adminchange.html",
            context.request.url
        );

    return context.env.ASSETS.fetch(assetURL);
}