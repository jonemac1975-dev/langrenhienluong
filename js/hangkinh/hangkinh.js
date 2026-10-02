import{readData}from "../../scripts/firebaseService.js";
import{getAuth,signInWithEmailAndPassword,onAuthStateChanged}from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import{app}from "../../scripts/firebaseConfig.js";

let LIST=[];
let CURRENT=null;
let DATA_LOADED_AT=0;
let DATA_LOADING=null;
const DATA_CACHE_TIME=60000;

//======================================================
// GET LIST
//======================================================

export async function getList(){
    await loadData();
    return LIST;
}

//======================================================
// GET ACTIVITIES
//======================================================

export async function getActivities(hangKinhId){
    if(!hangKinhId){
        return [];
    }

    try{
        const data=await readData("hangkinh/activities");
        if(!data){
            return [];
        }
        return Object.entries(data)
            .map(([id,item])=>({
                id,
                ...item
            }))
            .filter(item=>item.hangkinh_id===hangKinhId)
            .sort((a,b)=>(b.updated_at||0)-(a.updated_at||0));
    }catch(error){
        console.error("❌ LOAD HÀNG KỈNH ACTIVITIES ERROR:",error);
        return [];
    }
}

//======================================================
// LOAD DATA
//======================================================

async function loadData(force=false){
    const now=Date.now();

    if(!force&&DATA_LOADED_AT&&(now-DATA_LOADED_AT)<DATA_CACHE_TIME){
        return LIST;
    }

    if(DATA_LOADING){
        return DATA_LOADING;
    }

    DATA_LOADING=(async()=>{
        try{
            const data=await readData("admin/hangkinh");

            if(!data){
                LIST=[];
                CURRENT=null;
                DATA_LOADED_AT=Date.now();
                return LIST;
            }

            LIST=Object.entries(data).map(([id,item])=>({
                id,
                ...item
            }));

            sortData();
            CURRENT=LIST[0]||null;
            DATA_LOADED_AT=Date.now();

            return LIST;
        }catch(error){
            console.error("❌ LOAD HÀNG KỈNH ERROR:",error);
            LIST=[];
            CURRENT=null;
            DATA_LOADED_AT=0;
            return LIST;
        }finally{
            DATA_LOADING=null;
        }
    })();

    return DATA_LOADING;
}

//======================================================
// SORT DATA
//======================================================

function sortData(){
    LIST.sort((a,b)=>{
        const astt=Number(a.stt)||0;
        const bstt=Number(b.stt)||0;

        if(astt!==bstt){
            return astt-bstt;
        }

        return (b.updated_at||0)-(a.updated_at||0);
    });
}

//======================================================
// GET CURRENT
//======================================================

export function getCurrent(){
    return CURRENT;
}

//======================================================
// FORCE RELOAD
//======================================================

export async function reload(){
    return await loadData(true);
}

//======================================================
// LOGIN HÀNG KỈNH
//======================================================

export async function loginHangKinh(item,password){
    if(!item){
        throw new Error("❌ Không tìm thấy Hàng Kỉnh.");
    }

    if(!item.email){
        throw new Error("❌ Hàng Kỉnh chưa có Email Auth.");
    }

    if(!item.uid){
        throw new Error("❌ Hàng Kỉnh chưa có UID Firebase.");
    }

    if(!password){
        throw new Error("❌ Vui lòng nhập mật khẩu.");
    }

    try{
        const auth=getAuth(app);
        const credential=await signInWithEmailAndPassword(auth,item.email,password);
        const uid=credential.user.uid;

        if(uid!==item.uid){
            console.error("❌ UID HÀNG KỈNH KHÔNG KHỚP");
            await auth.signOut();
            throw new Error("❌ Tài khoản Firebase không khớp Hàng Kỉnh này.");
        }

        window.location.href=`/hangkinh/tab/hangkinh.html?id=${encodeURIComponent(item.id)}&user=${encodeURIComponent(item.user||"")}`;
    }catch(error){
        console.error("❌ HÀNG KỈNH FIREBASE LOGIN ERROR:",error);

        if(error.code==="auth/invalid-credential"||error.code==="auth/wrong-password"||error.code==="auth/user-not-found"){
            throw new Error("❌ Mật khẩu không đúng.");
        }

        if(error.code==="auth/too-many-requests"){
            throw new Error("❌ Có quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau.");
        }

        throw error;
    }
}

//======================================================
// TRANG HÀNG KỈNH
//======================================================

function init(){
    const params=new URLSearchParams(window.location.search);
    const hangKinhId=params.get("id")||"";
    const hangKinhUser=params.get("user")||"";

    document.getElementById("hk-home")?.addEventListener("click",()=>{
        window.location.href="/";
    });

    document.getElementById("hk-update")?.addEventListener("click",()=>{
        window.location.href=`/hangkinh/tab/hangkinhupdate.html?id=${encodeURIComponent(hangKinhId)}&user=${encodeURIComponent(hangKinhUser)}`;
    });

    if(!hangKinhId){
        console.warn("⚠️ TRANG HÀNG KỈNH KHÔNG CÓ ID.");
        return;
    }

    const auth=getAuth(app);

    onAuthStateChanged(auth,async user=>{
        if(!user){
            console.warn("⚠️ HÀNG KỈNH CHƯA ĐĂNG NHẬP.");
            window.location.replace("/");
            return;
        }

        await verifyHangKinh(user.uid,hangKinhId,hangKinhUser);
    });
}

//======================================================
// VERIFY HÀNG KỈNH
//======================================================

async function verifyHangKinh(uid,hangKinhId,hangKinhUser){
    try{
        const data=await readData("admin/hangkinh");

        if(!data||!data[hangKinhId]){
            console.warn("⚠️ KHÔNG TÌM THẤY HÀNG KỈNH:",hangKinhId);
            window.location.replace("/");
            return;
        }

        const current=data[hangKinhId];
        if(!current.uid||current.uid!==uid){
            console.warn("❌ UID KHÔNG KHỚP");
            const auth=getAuth(app);
            await auth.signOut();
            window.location.replace("/");
            return;
        }

        const idInput=document.getElementById("hk-id");
        const userInput=document.getElementById("hk-user");

        if(idInput){
            idInput.value=hangKinhId;
        }

        if(userInput){
            userInput.value=current.user||hangKinhUser;
        }
        
    }catch(error){
        console.error("❌ VERIFY HÀNG KỈNH ERROR:",error);
        const auth=getAuth(app);
        await auth.signOut();
        window.location.replace("/");
    }
}

//======================================================
// CHỈ INIT KHI ĐANG Ở TRANG HÀNG KỈNH
//======================================================

if(window.location.pathname.includes("/hangkinh/tab/hangkinh.html")){
    init();
}