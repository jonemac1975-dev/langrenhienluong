//======================================================
// HIENLUONG WEBSITE
// Folder : /scripts
// File   : contentService.js
//======================================================

import {readData,writeData}from"./firebaseService.js";

//======================================================
// ROOT
//======================================================

const ROOT = "admin";

//======================================================
// COMMON
//======================================================

export async function loadContent(section){
    return await readData(`${ROOT}/${section}`);


export async function saveContent(section,data){
    return await writeData(`${ROOT}/${section}`,data);
}

//======================================================
// GIỚI THIỆU
//======================================================

export const loadGioiThieu = ()=>
    loadContent("gioithieu");

export const saveGioiThieu = (data)=>
    saveContent("gioithieu",data);

//======================================================
// LỊCH SỬ
//======================================================

export const loadLichSu = ()=>
    loadContent("lichsu");

export const saveLichSu = (data)=>
    saveContent("lichsu",data);

//======================================================
// DANH THẮNG
//======================================================

export const loadDanhThang = ()=>
    loadContent("danhthang");

export const saveDanhThang = (data)=>
    saveContent("danhthang",data);

//======================================================
// ẨM THỰC
//======================================================

export const loadAmThuc = ()=>
    loadContent("amthuc");

export const saveAmThuc = (data)=>
    saveContent("amthuc",data);

//======================================================
// ĐỊA DANH
//======================================================

export const loadDiaDanh = ()=>
    loadContent("diadanh");

export const saveDiaDanh = (data)=>
    saveContent("diadanh",data);

//======================================================
// HỌ TỘC
//======================================================

export const loadHoToc = ()=>
    loadContent("hotoc");

export const saveHoToc = (data)=>
    saveContent("hotoc",data);

//======================================================
// TƯ LIỆU
//======================================================

export const loadTuLieu = ()=>
    loadContent("tulieu");

export const saveTuLieu = (data)=>
    saveContent("tulieu",data);