//======================================================
// HIENLUONG WEBSITE
// Folder : /scripts
// File   : firebaseService.js
//======================================================

import {

    db

}

from

"./firebaseConfig.js";

import {

    ref,

    get,

    set,

    update,

    remove,

    onValue,

    off

}

from

"https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

//======================================================
// READ
//======================================================

export async function readData(path){

    try{

        const snapshot =

            await get(

                ref(db,path)

            );

        return snapshot.exists()

            ? snapshot.val()

            : null;

    }

    catch(error){

        console.error(

            "READ ERROR",

            path,

            error

        );

        return null;

    }

}

//======================================================
// WRITE
//======================================================

export async function writeData(path,data){

    try{

        await set(

            ref(db,path),

            data

        );

        return true;

    }

    catch(error){

        console.error(

            "WRITE ERROR",

            path,

            error

        );

        return false;

    }

}

//======================================================
// UPDATE
//======================================================

export async function updateData(path,data){

    try{

        await update(

            ref(db,path),

            data

        );

        return true;

    }

    catch(error){

        console.error(

            "UPDATE ERROR",

            path,

            error

        );

        return false;

    }

}

//======================================================
// REMOVE
//======================================================

export async function removeData(path){

    try{

        await remove(

            ref(db,path)

        );

        return true;

    }

    catch(error){

        console.error(

            "REMOVE ERROR",

            path,

            error

        );

        return false;

    }

}

//======================================================
// REALTIME
//======================================================

export function onDataChange(path,callback){

    const listener =

        ref(

            db,

            path

        );

    onValue(

        listener,

        snapshot=>{

            callback(

                snapshot.val()

            );

        }

    );

    return listener;

}

//======================================================
// STOP REALTIME
//======================================================

export function offDataChange(listener){

    if(listener){

        off(listener);

    }

}

//======================================================
// SERVER TIME
//======================================================

export function serverTimestamp(){

    return Date.now();

}

//======================================================
// GENERATE ID
//======================================================

export async function generateId(

    path,

    prefix

){

    const list =

        await readData(path)

        ||

        {};

    let max = 0;

    Object.keys(list)

    .forEach(key=>{

        const n =

            parseInt(

                key.replace(

                    prefix,

                    ""

                )

            );

        if(

            !isNaN(n)

            &&

            n>max

        ){

            max=n;

        }

    });

    return

        prefix +

        String(max+1)

        .padStart(

            3,

            "0"

        );

}