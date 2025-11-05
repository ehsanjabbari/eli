// ایجاد مستقیم محصولات نمونه در localStorage
// اجرای این کد در کنسول مرورگر

// محصولات نمونه
const sampleProducts = [
    {
        id: Date.now() + 1,
        name: "کفش کتانی زنانه ورزشی",
        color: "سفید",
        size: "37-40",
        price: 2500000,
        stock: 15,
        category: "ورزشی"
    },
    {
        id: Date.now() + 2,
        name: "کفش مجلسی پاشنه بلند",
        color: "سیاه",
        size: "36-39",
        price: 1800000,
        stock: 8,
        category: "مجلسی"
    },
    {
        id: Date.now() + 3,
        name: "کفش روزمره بندی",
        color: "قهوه‌ای",
        size: "35-42",
        price: 1200000,
        stock: 22,
        category: "روزمره"
    },
    {
        id: Date.now() + 4,
        name: "کفش بوت زمستانی",
        color: "مشکی",
        size: "36-43",
        price: 3200000,
        stock: 12,
        category: "زمستانی"
    },
    {
        id: Date.now() + 5,
        name: "صندل تابستانی",
        color: "رنگارنگ",
        size: "35-41",
        price: 800000,
        stock: 35,
        category: "تابستانی"
    }
];

// محصولات موجود را بگیر
let existingProducts = [];
try {
    existingProducts = JSON.parse(localStorage.getItem('elishoes_products') || '[]');
} catch (e) {
    console.error('خطا در خواندن محصولات:', e);
}

// محصولات نمونه را اضافه کن (فقط اگر قبلاً وجود ندارند)
const existingNames = existingProducts.map(p => p.name + ' ' + p.color);
const productsToAdd = sampleProducts.filter(p => 
    !existingNames.includes(p.name + ' ' + p.color)
);

// اگر محصولی وجود نداشت، آن را اضافه کن
if (productsToAdd.length > 0) {
    const allProducts = [...existingProducts, ...productsToAdd];
    localStorage.setItem('elishoes_products', JSON.stringify(allProducts));
    console.log('✅ محصولات نمونه ایجاد شدند:', productsToAdd);
} else {
    console.log('⚠️ محصولات نمونه قبلاً وجود دارند');
}

// محصولات فعلی را نمایش بده
console.log('📦 محصولات کنونی:', JSON.parse(localStorage.getItem('elishoes_products') || '[]'));

// تست dropdown entry product select
if (typeof updateEntryProductSelect === 'function') {
    console.log('🔄 به‌روزرسانی dropdown محصولات...');
    updateEntryProductSelect();
}