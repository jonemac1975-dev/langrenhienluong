function getYoutubeId(url){
    try{
        const value=String(url||"").trim();
        if(!value)return "";

        const parsed=new URL(value);

        if(parsed.hostname.includes("youtube.com")){
            return parsed.searchParams.get("v")||"";
        }

        if(parsed.hostname==="youtu.be"){
            return parsed.pathname
                .replace(/^\/+/,"")
                .split("/")[0]
                .trim();
        }

        return "";
    }catch(err){
        console.warn("⚠️ YOUTUBE PARSE ERROR:",err);
        return "";
    }
}

function getGoogleDriveId(url){
    try{
        const value=String(url||"").trim();
        if(!value)return "";

        const parsed=new URL(value);

        if(!parsed.hostname.includes("drive.google.com")){
            return "";
        }

        const match=parsed.pathname.match(/\/file\/d\/([^/]+)/);

        if(match&&match[1]){
            return match[1];
        }

        return parsed.searchParams.get("id")||"";

    }catch(err){
        console.warn("⚠️ GOOGLE DRIVE PARSE ERROR:",err);
        return "";
    }
}

function isTikTok(url){
    try{
        const parsed=new URL(String(url||"").trim());

        return (
            parsed.hostname.includes("tiktok.com") ||
            parsed.hostname==="vm.tiktok.com"
        );

    }catch(err){
        return false;
    }
}

function isFacebook(url){
    try{
        const parsed=new URL(String(url||"").trim());

        return (
            parsed.hostname.includes("facebook.com") ||
            parsed.hostname.includes("fb.watch")
        );

    }catch(err){
        return false;
    }
}

function isDirectVideo(url){
    try{
        const parsed=new URL(String(url||"").trim());
        const path=parsed.pathname.toLowerCase();

        return (
            path.endsWith(".mp4") ||
            path.endsWith(".webm") ||
            path.endsWith(".ogg") ||
            path.endsWith(".mov")
        );

    }catch(err){
        return false;
    }
}

function openLinkButton(url,icon,text){
    return `
        <div class="hl-video-link">
            <a
                href="${escapeAttribute(url)}"
                target="_blank"
                rel="noopener noreferrer"
                class="hl-video-open">
                ${icon} ${text}
            </a>
        </div>
    `;
}

export function renderVideo(url){

    if(!url){
        return "";
    }

    const value=String(url).trim();

    const youtubeId=getYoutubeId(value);

    if(youtubeId){
        return `
            <iframe
                class="hl-video"
                src="https://www.youtube.com/embed/${encodeURIComponent(youtubeId)}"
                title="YouTube video"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen>
            </iframe>
        `;
    }

    const driveId=getGoogleDriveId(value);

    if(driveId){
        return `
            <iframe
                class="hl-video hl-video-drive"
                src="https://drive.google.com/file/d/${encodeURIComponent(driveId)}/preview"
                title="Google Drive video"
                frameborder="0"
                allow="autoplay"
                allowfullscreen>
            </iframe>
        `;
    }

    if(isDirectVideo(value)){
        return `
            <video
                class="hl-video"
                controls
                playsinline
                preload="metadata">
                <source src="${escapeAttribute(value)}">
                Trình duyệt không hỗ trợ video.
            </video>
        `;
    }

    if(isFacebook(value)){
        return openLinkButton(
            value,
            "📘",
            "Video (Facebook / Reel)"
        );
    }

    if(isTikTok(value)){
        return openLinkButton(
            value,
            "🎵",
            "Video (TikTok)"
        );
    }

    return openLinkButton(
        value,
        "🔗",
        "Video (liên kết)"
    );
}

function escapeAttribute(value){
    return String(value||"")
        .replace(/&/g,"&amp;")
        .replace(/"/g,"&quot;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;");
}