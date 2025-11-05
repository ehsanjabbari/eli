// اسکریپت کامل تست سیستم - اجرا در کنسول مرورگر

console.log('🚀 شروع تست سیستم انبارداری کفش...');

// مرحله 1: ایجاد محصولات نمونه
console.log('📦 مرحله 1: ایجاد محصولات نمونه');

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
    console.log('✅ محصولات نمونه ایجاد شدند:', productsToAdd.length, 'محصول');
} else {
    console.log('⚠️ محصولات نمونه قبلاً وجود دارند');
}

// مرحله 2: تنظیم تاریخ شمسی
console.log('📅 مرحله 2: تنظیم تاریخ شمسی');

// تابع تبدیل میلادی به شمسی
function gregorianToJalali(gregorianYear, gregorianMonth, gregorianDay) {
    const g_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const j_days_in_month = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
    
    const g_y = gregorianYear;
    const g_m = gregorianMonth;
    const g_d = gregorianDay;
    
    const g_j_day_number = 365 * g_y + Math.floor((g_y - 1) / 4) - Math.floor((g_y - 1) / 100) + Math.floor((g_y - 1) / 400) + Math.floor((367 * g_m - 362) / 12) + (g_m > 2 ? (isLeap(g_y) ? -1 : -2) : 0) + g_d;
    
    const j_day_number = g_j_day_number - 79;
    const j_np = Math.floor(j_day_number / 12053);
    const j_day = j_day_number % 12053;
    const j_y = 979 + 33 * j_np + 4 * Math.floor(j_day / 1461);
    j_day %= 1461;
    
    if (j_day >= 366) {
        j_y += Math.floor((j_day - 1) / 365);
        j_day = (j_day - 1) % 365;
    }
    
    let j_m = 1;
    const j_days_in_year = isLeapJalali(j_y) ? 366 : 365;
    while (j_day >= (j_days_in_year === 366 && j_m > 11 ? j_days_in_month[j_m - 1] : j_days_in_month[j_m - 1])) {
        j_day -= j_days_in_month[j_m - 1];
        j_m++;
        if (j_m > 12) j_m = 1;
    }
    
    return { year: j_y, month: j_m, day: j_day + 1 };
}

function isLeap(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function isLeapJalali(year) {
    return ((year - 474) % 2820 + 474) * 682 % 2816 < 682;
}

function getTodayPersian() {
    const today = new Date();
    const persian = gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const year = persian.year;
    const month = String(persian.month).padStart(2, '0');
    const day = String(persian.day).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

function getYesterdayPersian() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const persian = gregorianToJalali(yesterday.getFullYear(), yesterday.getMonth() + 1, yesterday.getDate());
    const year = persian.year;
    const month = String(persian.month).padStart(2, '0');
    const day = String(persian.day).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

// تنظیم تاریخ‌های شمسی
const todayPersian = getTodayPersian();
const yesterdayPersian = getYesterdayPersian();

localStorage.setItem('elishoes_today_persian', todayPersian);
localStorage.setItem('elishoes_yesterday_persian', yesterdayPersian);

console.log('✅ تاریخ‌های شمسی تنظیم شد:');
console.log('امروز:', todayPersian);
console.log('دیروز:', yesterdayPersian);

// مرحله 3: تست dropdown محصولات
console.log('🎯 مرحله 3: تست dropdown محصولات');

// نمایش محصولات کنونی
const currentProducts = JSON.parse(localStorage.getItem('elishoes_products') || '[]');
console.log('📋 محصولات موجود:', currentProducts.length, 'محصول');
currentProducts.forEach((product, index) => {
    console.log(`${index + 1}. ${product.name} - ${product.color} (موجودی: ${product.stock})`);
});

// تست dropdown update
if (typeof updateEntryProductSelect === 'function') {
    console.log('🔄 به‌روزرسانی dropdown محصولات...');
    updateEntryProductSelect();
    console.log('✅ dropdown محصولات به‌روزرسانی شد');
} else {
    console.log('⚠️ تابع updateEntryProductSelect یافت نشد');
}

// مرحله 4: تست ایجاد فاکتور نمونه
console.log('📄 مرحله 4: آماده‌سازی برای ایجاد فاکتور نمونه');

// نمایش تاریخ‌های مهم
console.log('📅 تاریخ‌های مهم برای تست:');
console.log('- امروز (2025-11-05):', todayPersian);
console.log('- دیروز (2025-11-04):', yesterdayPersian);

// دستورالعمل‌های تست
console.log('💡 دستورالعمل‌های تست:');
console.log('1. به سیستم اصلی بروید (localhost:8003)');
console.log('2. به تب "ورود محصولات" بروید');
console.log('3. از dropdown محصولات، یکی را انتخاب کنید');
console.log('4. تعداد وارد کنید');
console.log('5. تاریخ فاکتور را به', yesterdayPersian, 'تغییر دهید');
console.log('6. روی "➕ افزودن" کلیک کنید');
console.log('7. این کار را برای چندین محصول تکرار کنید');
console.log('8. در نهایت "ذخیره فاکتور" را بزنید');

console.log('🎉 تست آماده است! لطفاً سیستم اصلی را باز کنید.');

// پیام خلاصه
console.log('📊 خلاصه تست:');
console.log('- محصولات ایجاد شده:', currentProducts.length);
console.log('- تاریخ امروز (شمسی):', todayPersian);
console.log('- تاریخ دیروز (شمسی):', yesterdayPersian);
console.log('- سیستم آماده برای تست است');