// تست سریع تابع formatPersianDate
function formatPersianDate(dateString) {
    if (!dateString) return new Date().toLocaleDateString('fa-IR');
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR');
}

// تست‌ها
console.log('تست‌های تاریخ شمسی:');
console.log('1. تاریخ امروز:', formatPersianDate(null));
console.log('2. تاریخ میلادی:', formatPersianDate('2024-01-15'));
console.log('3. تاریخ امروز با new Date():', formatPersianDate(new Date().toISOString()));

// نمایش در صفحه
document.addEventListener('DOMContentLoaded', function() {
    const results = document.getElementById('test-results');
    results.innerHTML = `
        <h3>نتایج تست توابع تاریخ شمسی:</h3>
        <p><strong>1. تاریخ امروز:</strong> ${formatPersianDate(null)}</p>
        <p><strong>2. تاریخ میلادی (2024-01-15):</strong> ${formatPersianDate('2024-01-15')}</p>
        <p><strong>3. تاریخ فعلی سیستم:</strong> ${formatPersianDate(new Date().toISOString())}</p>
        <p><strong>4. تست کتابخانه Persian Date:</strong> ${typeof PersianDate !== 'undefined' ? '✓ بارگذاری شده' : '✗ بارگذاری نشده'}</p>
    `;
});