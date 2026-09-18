//======================================================
// HIENLUONG WEBSITE
// File : /scripts/customersCache.js
// Mục đích:
// Cache dùng chung dữ liệu customers cho INDEX
//======================================================

import {readData} from "./firebaseService.js";
let CUSTOMERS = null;
let LOADED_AT = 0;
let LOADING = null;
const CACHE_TIME = 60000;

//======================================================
// LẤY CUSTOMERS
//======================================================

export async function getCustomers(force = false) {
    const now = Date.now();

    //==================================================
    // CACHE CÒN HẠN
    //==================================================

    if (!force && CUSTOMERS !== null && now - LOADED_AT < CACHE_TIME) {
                return CUSTOMERS;
    }

    //==================================================
    // ĐANG CÓ REQUEST KHÁC
    // Không đọc Firebase lần 2
    //==================================================

    if (LOADING) {
        return LOADING;
    }

    //==================================================
    // ĐỌC FIREBASE
    //==================================================

    LOADING =
        readData(
            "customers"
        )
        .then(function(data) {
                CUSTOMERS = data || {};
                LOADED_AT = Date.now();
                return CUSTOMERS;
            }
        )
        .catch(
            function(error) {
                console.error("❌ CUSTOMERS LOAD ERROR:",error);
                throw error;
            }
        )
        .finally(
            function() {
                LOADING = null;
            }
        );
    return LOADING;
}

//======================================================
// XÓA CACHE
// Dùng khi sau này cần ép đọc lại Firebase
//======================================================

export function clearCustomersCache() {
    CUSTOMERS = null;
    LOADED_AT = 0;
}