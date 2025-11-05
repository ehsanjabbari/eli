// تست ایجاد محصول و فاکتور نمونه
// محصولات نمونه
const sampleProducts = [
    { id: 1, name: "کفش کتانی زنانه ورزشی", color: "سفید", stock: 15 },
    { id: 2, name: "کفش مجلسی پاشنه بلند", color: "سیاه", stock: 8 }
];

// ایجاد محصولات در localStorage
localStorage.setItem('shoe_products', JSON.stringify(sampleProducts));

// ایجاد فاکتور نمونه
const sampleInvoice = {
    id: 1,
    date: '2024-12-01', // تاریخ میلادی
    items: [
        { name: 'کفش کتانی زنانه ورزشی', color: 'سفید', quantity: 5 }
    ]
};

const entryInvoices = [sampleInvoice];
localStorage.setItem('entry_invoices', JSON.stringify(entryInvoices));

console.log('✅ محصولات و فاکتور نمونه ایجاد شد');
console.log('📅 تاریخ فاکتور (میلادی):', sampleInvoice.date);
console.log('📅 تاریخ فاکتور (شمسی):', new Date(sampleInvoice.date).toLocaleDateString('fa-IR'));