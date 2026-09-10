//======================================================
// HIENLUONG WEBSITE
// Folder : /scripts
// File   : firebaseConfig.js
//======================================================

import {
    initializeApp
}
from
"https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getDatabase
}
from
"https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

//======================================================
// FIREBASE CONFIG
//======================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyAeft7__nsx_hdJGAwHIPa_uf5SJcY9bng",

    authDomain:
        "hienluong-b2d36.firebaseapp.com",

    databaseURL:
        "https://hienluong-b2d36-default-rtdb.asia-southeast1.firebasedatabase.app",

    projectId:
        "hienluong-b2d36",

    storageBucket:
        "hienluong-b2d36.firebasestorage.app",

    messagingSenderId:
        "735247873334",

    appId:
        "1:735247873334:web:8a1ff6169cce7e05d72f97"

};

//======================================================
// INIT FIREBASE
//======================================================

const app = initializeApp(

    firebaseConfig

);

const db = getDatabase(

    app

);

//======================================================

export {

    app,

    db

};