//======================================================
// HIENLUONG
// ADMIN TAB - BLOCK URL KHÔNG CÓ .html
//======================================================

export async function onRequest(context) {

    const url = new URL(context.request.url);

    // Chỉ chặn URL /admin/tab/... không có .html
    if (
    url.pathname.startsWith("/admin/tab/") &&
    !url.pathname.endsWith(".html") &&
    url.pathname !== "/admin/tab/adminlogin"
) {

        return new Response(
            `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>404 - Không tìm thấy trang</title>

<style>
*{
    box-sizing:border-box;
}

body{
    margin:0;
    min-height:100vh;
    display:flex;
    align-items:center;
    justify-content:center;
    font-family:Arial,sans-serif;
    background:#f5f1eb;
    color:#4b3625;
    text-align:center;
}

.box{
    width:min(90%,520px);
    padding:45px 30px;
    background:#fff;
    border-radius:18px;
    box-shadow:0 8px 30px rgba(0,0,0,.12);
}

.code{
    font-size:72px;
    font-weight:bold;
    margin-bottom:10px;
}

h1{
    margin:0 0 15px;
    font-size:25px;
}

p{
    margin:8px 0;
    color:#666;
    line-height:1.6;
}

a{
    display:inline-block;
    margin-top:25px;
    padding:12px 22px;
    background:#6b4f36;
    color:#fff;
    text-decoration:none;
    border-radius:8px;
}
</style>
</head>

<body>

<div class="box">

    <div class="code">404</div>

    <h1>🔎 Không tìm thấy trang</h1>

    <p>Đường dẫn anh vừa nhập không tồn tại.</p>
    <p>Vui lòng kiểm tra lại đường dẫn.</p>

    <a href="/">← Về trang chủ</a>

</div>

</body>
</html>`,
            {
                status: 404,
                headers: {
                    "Content-Type": "text/html; charset=UTF-8"
                }
            }
        );
    }

    // URL hợp lệ → cho Function tương ứng xử lý tiếp
    return context.next();
}