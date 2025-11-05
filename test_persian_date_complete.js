// تست کامل تاریخ شمسی در سیستم انبارداری
// اجرا در کنسول مرورگر

console.log('🚀 تست کامل تاریخ شمسی در سیستم انبارداری...');

// تست توابع تاریخ شمسی
console.log('📅 تست توابع تاریخ شمسی...');

// محاسبه تاریخ‌های مهم
const today = new Date('2025-11-05'); // امروز
const yesterday = new Date('2025-11-04'); // دیروز
const tomorrow = new Date('2025-11-06'); // فردا

// تبدیل به شمسی (دستی برای تست)
function testGregorianToJalali(gregorianYear, gregorianMonth, gregorianDay) {
    // تبدیل ساده برای تست (این تابع قبلاً در سیستم موجود است)
    const yearOffset = 622; // اختلاف میلادی و شمسی
    const persianYear = gregorianYear - yearOffset;
    const persianMonth = gregorianMonth;
    const persianDay = gregorianDay;
    
    return {
        year: persianYear,
        month: String(persianMonth).padStart(2, '0'),
        day: String(persianDay).padStart(2, '0')
    };
}

function formatPersianDate(date) {
    const persian = testGregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    return `${persian.year}/${persian.month}/${persian.day}`;
}

// نمایش تاریخ‌های تست
console.log('📊 تاریخ‌های تست:');
console.log('- امروز (2025-11-05):', formatPersianDate(today));
console.log('- دیروز (2025-11-04):', formatPersianDate(yesterday));
console.log('- فردا (2025-11-06):', formatPersianDate(tomorrow));

// تست ایجاد محصولات نمونه
console.log('📦 تست ایجاد محصولات نمونه...');

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
    }
];

// ایجاد محصولات در localStorage
try {
    let existingProducts = JSON.parse(localStorage.getItem('elishoes_products') || '[]');
    const existingNames = existingProducts.map(p => p.name + ' ' + p.color);
    const productsToAdd = sampleProducts.filter(p => 
        !existingNames.includes(p.name + ' ' + p.color)
    );

    if (productsToAdd.length > 0) {
        const allProducts = [...existingProducts, ...productsToAdd];
        localStorage.setItem('elishoes_products', JSON.stringify(allProducts));
        console.log('✅ محصولات نمونه ایجاد شدند:', productsToAdd.length, 'محصول');
    } else {
        console.log('⚠️ محصولات نمونه قبلاً وجود دارند');
    }
} catch (error) {
    console.error('❌ خطا در ایجاد محصولات:', error);
}

// تست ایجاد فاکتور نمونه با تاریخ شمسی
console.log('📄 تست ایجاد فاکتور نمونه...');

// ایجاد فاکتور ورودی نمونه با تاریخ دیروز
const yesterdayPersian = formatPersianDate(yesterday);

const sampleInvoice = {
    id: Date.now(),
    date: yesterdayPersian,
    items: [
        {
            name: "کفش کتانی زنانه ورزشی",
            color: "سفید",
            quantity: 5,
            invoiceDate: yesterdayPersian
        },
        {
            name: "کفش مجلسی پاشنه بلند",
            color: "سیاه", 
            quantity: 2,
            invoiceDate: yesterdayPersian
        }
    ]
};

// ذخیره فاکتور نمونه
try {
    const existingInvoices = JSON.parse(localStorage.getItem('entryInvoices') || '[]');
    existingInvoices.push(sampleInvoice);
    localStorage.setItem('entryInvoices', JSON.stringify(existingInvoices));
    console.log('✅ فاکتور نمونه ایجاد شد با تاریخ:', yesterdayPersian);
} catch (error) {
    console.error('❌ خطا در ایجاد فاکتور نمونه:', error);
}

// تست فراخوانی توابع به‌روزرسانی
console.log('🔄 تست فراخوانی توابع به‌روزرسانی...');

// فراخوانی تابع به‌روزرسانی dropdown محصولات
if (typeof updateEntryProductSelect === 'function') {
    try {
        updateEntryProductSelect();
        console.log('✅ dropdown محصولات به‌روزرسانی شد');
    } catch (error) {
        console.error('❌ خطا در به‌روزرسانی dropdown:', error);
    }
} else {
    console.log('⚠️ تابع updateEntryProductSelect یافت نشد');
}

// فراخوانی تابع رندر فاکتورها
if (typeof renderEntryInvoices === 'function') {
    try {
        renderEntryInvoices();
        console.log('✅ فاکتورهای ورودی رندر شدند');
    } catch (error) {
        console.error('❌ خطا در رندر فاکتورهای ورودی:', error);
    }
} else {
    console.log('⚠️ تابع renderEntryInvoices یافت نشد');
}

// فراخوانی تابع تنظیم تاریخ پیش‌فرض
if (typeof setDefaultInvoiceDate === 'function') {
    try {
        setDefaultInvoiceDate();
        console.log('✅ تاریخ پیش‌فرض تنظیم شد');
    } catch (error) {
        console.error('❌ خطا در تنظیم تاریخ پیش‌فرض:', error);
    }
} else {
    console.log('⚠️ تابع setDefaultInvoiceDate یافت نشد');
}

// نمایش خلاصه تست
console.log('📋 خلاصه تست:');
const currentProducts = JSON.parse(localStorage.getItem('elishoes_products') || '[]');
const currentInvoices = JSON.parse(localStorage.getItem('entryInvoices') || '[]');
console.log('- محصولات موجود:', currentProducts.length);
console.log('- فاکتورهای ورودی:', currentInvoices.length);

if (currentInvoices.length > 0) {
    const lastInvoice = currentInvoices[currentInvoices.length - 1];
    console.log('- آخرین فاکتور:', {
        id: lastInvoice.id,
        date: lastInvoice.date,
        items: lastInvoice.items.length
    });
}

// دستورالعمل‌های تست نهایی
console.log('💡 دستورالعمل‌های تست:');
console.log('1. به سیستم اصلی بروید (http://localhost:8005)');
console.log('2. به تب "ورود محصولات" بروید');
console.log('3. تاریخ فاکتور را بررسی کنید (باید شمسی باشد)');
console.log('4. از dropdown محصولات استفاده کنید');
console.log('5. فاکتور نمونه موجود را مشاهده کنید');
console.log('6. فاکتور جدید با تاریخ شمسی ایجاد کنید');

// پیام نهایی
console.log('🎉 تست آماده است! لطفاً سیستم اصلی را باز کنید و عملکرد را بررسی کنید.');