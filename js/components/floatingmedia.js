//======================================================
// HIENLUONG WEBSITE
// File : /js/components/floatingmedia.js
//======================================================

console.log("🎬 FLOATING MEDIA LOADED");

//======================================================

let PANEL = null;

let BODY = null;

let TITLE = null;

//======================================================
// INIT
//======================================================

init();

//======================================================

function init(){

if(document.getElementById("hl-floating-media")){
return;
}

injectCss();

PANEL = document.createElement("div");
PANEL.id = "hl-floating-media";

PANEL.innerHTML = `

<div class="hl-floating-header">

<div id="hl-floating-title">
Media
</div>

<div class="hl-floating-tools">

<button
id="hl-floating-max"
title="Phóng to">
⤢
</button>

<button
id="hl-floating-close"
title="Đóng">
✕
</button>

</div>

</div>

<div
id="hl-floating-body"
class="hl-floating-body">
</div>

`;

document.body.appendChild(PANEL);

BODY = document.getElementById("hl-floating-body");

TITLE = document.getElementById("hl-floating-title");

// Đóng

document
.getElementById("hl-floating-close")
.onclick = hideMedia;

// Phóng to

document
.getElementById("hl-floating-max")
.onclick = ()=>{

PANEL.classList.toggle("fullscreen");

};

hideMedia();

}

//======================================================
// CSS
//======================================================

function injectCss(){

if(document.getElementById("floatingmedia-css")){
return;
}

const css = document.createElement("style");

css.id = "floatingmedia-css";

css.textContent = `

#hl-floating-media{

position:fixed;

right:20px;

bottom:20px;

width:360px;

height:220px;

background:#fff;

border-radius:10px;

overflow:hidden;

box-shadow:0 8px 30px rgba(0,0,0,.35);

z-index:99999;

display:none;

}

#hl-floating-media.fullscreen{

right:20px;

bottom:20px;

width:720px;

height:420px;

}

.hl-floating-header{

height:40px;

display:flex;

align-items:center;

justify-content:space-between;

padding:0 10px;

background:#0B5E55;

color:#fff;

font-weight:700;

}

.hl-floating-tools{

display:flex;

gap:8px;

}

.hl-floating-tools button{

border:none;

background:none;

color:#fff;

cursor:pointer;

font-size:18px;

}

.hl-floating-body{

width:100%;

height:calc(100% - 40px);

background:#000;

}

.hl-floating-body iframe{

width:100%;

height:100%;

border:none;

}

@media(max-width:768px){

#hl-floating-media{

left:0;

right:0;

bottom:0;

width:100%;

height:240px;

border-radius:12px 12px 0 0;

}

#hl-floating-media.fullscreen{

left:0;

right:0;

bottom:0;

width:100%;

height:60vh;

}

}

`;

document.head.appendChild(css);

}

//======================================================
// SHOW VIDEO
//======================================================

export function showVideo(url){

if(!url){

hideMedia();

return;

}

TITLE.textContent = "🎬 Video";

const embed = convertVideoUrl(url);

BODY.innerHTML = `

<iframe

src="${embed}"

allowfullscreen

allow="autoplay; encrypted-media">

</iframe>

`;

PANEL.style.display = "block";

}

//======================================================
// CONVERT VIDEO URL
//======================================================

function convertVideoUrl(url){

if(!url){
return "";
}

// youtube

if(url.includes("youtube.com/watch?v=")){

const id = url.split("v=")[1].split("&")[0];

return `https://www.youtube.com/embed/${id}`;

}

// youtu.be

if(url.includes("youtu.be/")){

const id = url.split("youtu.be/")[1].split("?")[0];

return `https://www.youtube.com/embed/${id}`;

}

// Google Drive

if(url.includes("drive.google.com")){

const m = url.match(/\/d\/([^/]+)/);

if(m){

return `https://drive.google.com/file/d/${m[1]}/preview`;

}

}

return url;

}

//======================================================
// SHOW MAP
//======================================================

export function showMap(url){

if(!url){

hideMedia();

return;

}

TITLE.textContent = "🗺 Google Maps";

const embed = convertMapUrl(url);

BODY.innerHTML = `

<iframe

src="${embed}"

loading="lazy"

allowfullscreen

referrerpolicy="no-referrer-when-downgrade">

</iframe>

`;

PANEL.style.display = "block";

}

//======================================================
// HIDE MEDIA
//======================================================

export function hideMedia(){

if(!PANEL){
return;
}

PANEL.style.display = "none";

if(BODY){
BODY.innerHTML = "";
}

if(PANEL.classList.contains("fullscreen")){
PANEL.classList.remove("fullscreen");
}

}

//======================================================
// CONVERT MAP URL
//======================================================

function convertMapUrl(url){

if(!url){
return "";
}

// Nếu đã là embed

if(url.includes("/maps/embed")){
return url;
}

// Link Google Maps thông thường

try{

const m = url.match(/!3d([-0-9.]+)!4d([-0-9.]+)/);

if(m){

const lat = m[1];

const lng = m[2];

return `https://www.google.com/maps?q=${lat},${lng}&z=17&output=embed`;

}

}catch(err){

console.warn(err);

}

// Link có q=

try{

const u = new URL(url);

const q = u.searchParams.get("q");

if(q){

return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;

}

}catch(err){

}

// Không chuyển được thì dùng luôn

return url;

}