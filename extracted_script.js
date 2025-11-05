    <script>
        // متغیرهای عمومی
        let products = JSON.parse(localStorage.getItem('products')) || [];
        let entryInvoices = JSON.parse(localStorage.getItem('entryInvoices')) || [];
        let salesInvoices151 = JSON.parse(localStorage.getItem('salesInvoices151')) || [];
        let salesInvoices168 = JSON.parse(localStorage.getItem('salesInvoices168')) || [];
        let tempEntryItems = [];
        let tempSales151Items = [];
        let tempSales168Items = [];
        let editingInvoice = null; // { type: 'entry'|'sales151'|'sales168', index: number }
        let currentAddTarget = null; // { type: 'entry'|'sales151'|'sales168', invoiceId: number }
        
        // متغیرهای مدیریت داده
        let cloudSync = {
            enabled: false,
            provider: null, // 'firebase', 'supabase', 'github', 'localStorage'
            config: null,
            lastSync: null
        };
        let autoBackupConfig = {
            enabled: true,
            interval: 3600000, // هر ساعت
            lastBackup: null
        };

        // ========== مدیریت داده و پشتیبان‌گیری ==========
        
        // تابع خروجی گرفتن از داده‌ها
        function exportData() {
            const data = {
                products: products,
                entryInvoices: entryInvoices,
                salesInvoices151: salesInvoices151,
                salesInvoices168: salesInvoices168,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = 'elishoes-backup-' + new Date().toISOString().split('T')[0] + '.json';
            link.click();
            
            showToast('فایل پشتیبان با موفقیت دانلود شد');
        }
        
        // تابع ورودی گرفتن از فایل
        function importData(input) {
            const file = input.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (!confirm('آیا از جایگزینی داده‌های فعلی با این فایل اطمینان دارید؟')) {
                        return;
                    }
                    
                    // اعتبارسنجی داده‌ها
                    if (data.products && Array.isArray(data.products)) {
                        products = data.products;
                        localStorage.setItem('products', JSON.stringify(products));
                    }
                    
                    if (data.entryInvoices && Array.isArray(data.entryInvoices)) {
                        entryInvoices = data.entryInvoices;
                        localStorage.setItem('entryInvoices', JSON.stringify(entryInvoices));
                    }
                    
                    if (data.salesInvoices151 && Array.isArray(data.salesInvoices151)) {
                        salesInvoices151 = data.salesInvoices151;
                        localStorage.setItem('salesInvoices151', JSON.stringify(salesInvoices151));
                    }
                    
                    if (data.salesInvoices168 && Array.isArray(data.salesInvoices168)) {
                        salesInvoices168 = data.salesInvoices168;
                        localStorage.setItem('salesInvoices168', JSON.stringify(salesInvoices168));
                    }
                    
                    // به‌روزرسانی UI
                    refreshInventory();
                    renderEntryInvoices();
                    renderSales151Invoices();
                    renderSales168Invoices();
                    updateSystemInfo();
                    
                    showToast('داده‌ها با موفقیت وارد شدند');
                    input.value = ''; // پاک کردن فایل انتخاب شده
                    
                } catch (error) {
                    console.error('خطا در خواندن فایل:', error);
                    showToast('خطا در خواندن فایل. لطفاً فرمت صحیح را بررسی کنید.', 'error');
                }
            };
            reader.readAsText(file);
        }
        
        // توابع دسترسی به داده برای همگام‌سازی
        function getInventory() {
            return JSON.parse(localStorage.getItem('products')) || [];
        }
        
        function getSales151() {
            return JSON.parse(localStorage.getItem('entryInvoices')) || [];
        }
        
        function getSales168() {
            return JSON.parse(localStorage.getItem('salesInvoices151')) || [];
        }
        
        function getAllInvoices() {
            const entryInvoices = JSON.parse(localStorage.getItem('entryInvoices')) || [];
            const sales151 = JSON.parse(localStorage.getItem('salesInvoices151')) || [];
            const sales168 = JSON.parse(localStorage.getItem('salesInvoices168')) || [];
            
            return {
                entryInvoices: entryInvoices,
                sales151: sales151,
                sales168: sales168
            };
        }
        
        // بازیابی داده از گیت هاب
        function restoreFromData(data) {
            // بازیابی انبار
            if (data.inventory && Array.isArray(data.inventory)) {
                localStorage.setItem('products', JSON.stringify(data.inventory));
                products = data.inventory;
            }
            
            // بازیابی فاکتورهای ورود
            if (data.sales151 && Array.isArray(data.sales151)) {
                localStorage.setItem('entryInvoices', JSON.stringify(data.sales151));
                entryInvoices = data.sales151;
            }
            
            // بازیابی فاکتورهای فروش 151
            if (data.sales151 && Array.isArray(data.sales151)) {
                localStorage.setItem('salesInvoices151', JSON.stringify(data.sales151));
                salesInvoices151 = data.sales151;
            }
            
            // بازیابی فاکتورهای فروش 168
            if (data.sales168 && Array.isArray(data.sales168)) {
                localStorage.setItem('salesInvoices168', JSON.stringify(data.sales168));
                salesInvoices168 = data.sales168;
            }
            
            // بازیابی فاکتورهای عمومی
            if (data.invoices && Array.isArray(data.invoices)) {
                // فاکتورهای عمومی در localStorage جداگانه ذخیره نمی‌شوند
                // این بخش برای نسخه‌های آینده رزرو شده است
            }
            
            // ایجاد backup خودکار
            autoBackup();
        }
        
        // تابع ایجاد پشتیبان محلی
        function createBackup() {
            const timestamp = new Date().toISOString();
            const backup = {
                products: products,
                entryInvoices: entryInvoices,
                salesInvoices151: salesInvoices151,
                salesInvoices168: salesInvoices168,
                backupDate: timestamp,
                version: '1.0'
            };
            
            // ذخیره در localStorage با کلید مخصوص
            localStorage.setItem('elishoes_backup', JSON.stringify(backup));
            localStorage.setItem('elishoes_last_backup', timestamp);
            
            // نمایش اندازه پشتیبان
            const backupSize = JSON.stringify(backup).length;
            const sizeKB = (backupSize / 1024).toFixed(2);
            
            showToast('پشتیبان محلی ایجاد شد (' + sizeKB + ' KB)');
            updateSystemInfo();
        }
        
        // تابع پاک کردن همه داده‌ها
        function clearAllData() {
            if (!confirm('آیا از پاک کردن همه داده‌ها اطمینان دارید؟ این عمل غیرقابل بازگشت است!')) {
                return;
            }
            
            if (!confirm('این آخرین هشدار است! تمام محصولات و فاکتورها پاک خواهند شد.')) {
                return;
            }
            
            // پاک کردن همه داده‌ها
            localStorage.removeItem('products');
            localStorage.removeItem('entryInvoices');
            localStorage.removeItem('salesInvoices151');
            localStorage.removeItem('salesInvoices168');
            localStorage.removeItem('elishoes_backup');
            localStorage.removeItem('elishoes_last_backup');
            
            // ریست کردن متغیرها
            products = [];
            entryInvoices = [];
            salesInvoices151 = [];
            salesInvoices168 = [];
            tempEntryItems = [];
            tempSales151Items = [];
            tempSales168Items = [];
            editingInvoice = null;
            currentAddTarget = null;
            
            // به‌روزرسانی UI
            refreshInventory();
            renderEntryInvoices();
            renderSales151Invoices();
            renderSales168Invoices();
            updateSystemInfo();
            
            showToast('همه داده‌ها پاک شدند');
        }
        
        // تابع به‌روزرسانی اطلاعات سیستم
        function updateSystemInfo() {
            const lastSave = localStorage.getItem('elishoes_last_backup') || 'نامشخص';
            
            document.getElementById('total-products-info').textContent = products.length;
            document.getElementById('entry-invoices-count').textContent = entryInvoices.length;
            document.getElementById('sales151-invoices-count').textContent = salesInvoices151.length;
            document.getElementById('sales168-invoices-count').textContent = salesInvoices168.length;
            document.getElementById('last-save-time').textContent = lastSave;
            
            // محاسبه اندازه ذخیره‌سازی
            let totalSize = 0;
            const keys = ['products', 'entryInvoices', 'salesInvoices151', 'salesInvoices168', 'elishoes_backup'];
            keys.forEach(key => {
                const item = localStorage.getItem(key);
                if (item) totalSize += item.length;
            });
            
            const sizeKB = (totalSize / 1024).toFixed(2);
            document.getElementById('storage-size').textContent = `${sizeKB} KB`;
        }
        
        // ========== تنظیمات همگام‌سازی ابری ==========
        
        // راه‌اندازی همگام‌سازی ابری
        function setupCloudSync() {
            alert('لطفاً یکی از گزینه‌های همگام‌سازی را انتخاب کنید:\n\n' +
                  '🔥 Firebase: پایگاه داده گوگل (رایگان)\n' +
                  '⚡ Supabase: جایگزین متن‌باز Firebase\n' +
                  '📱 GitHub: استفاده از GitHub Gist\n' +
                  '💾 LocalStorage Enhanced: بهبود localStorage');
        }
        
        // تنظیم Firebase
        function setupFirebase() {
            const message = `برای راه‌اندازی Firebase:

1. به https://console.firebase.google.com بروید
2. پروژه جدید ایجاد کنید
3. Firestore Database فعال کنید
4. API Key و config را کپی کنید
5. کد Firebase SDK را به این پروژه اضافه کنید

آیا می‌خواهید راهنمای کامل Firebase نمایش داده شود؟`;
            
            if (confirm(message)) {
                window.open('https://firebase.google.com/docs/firestore/quickstart', '_blank');
            }
        }
        
        // تنظیم Supabase
        function setupSupabase() {
            const message = `برای راه‌اندازی Supabase:

1. به https://supabase.com بروید
2. حساب جدید ایجاد کنید
3. پروژه جدید بسازید
4. Table ایجاد کنید با نام 'elishoes_data'
5. API URL و anon key را کپی کنید

آیا می‌خواهید راهنمای کامل Supabase نمایش داده شود؟`;
            
            if (confirm(message)) {
                window.open('https://supabase.com/docs/guides/getting-started/quickstarts/js', '_blank');
            }
        }
        
        // تنظیم GitHub
        function setupGitHub() {
            const savedConfig = localStorage.getItem('elishoes_cloud_sync');
            
            // اگر تنظیمات قبلی موجود باشد، فقط تست کن
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                if (config.enabled && config.provider === 'github' && config.config) {
                    // تست اتصال با تنظیمات موجود
                    testGitHubConnection(config.config.token, config.config.gistId);
                    return;
                }
            }
            
            // اگر تنظیمات نباشد، درخواست جدید کن
            // درخواست Personal Access Token
            const token = prompt('لطفاً Personal Access Token از GitHub را وارد کنید:\n\nراهنما:\n1. به github.com بروید\n2. Settings → Developer settings → Personal access tokens\n3. Generate new token (classic)\n4. scopes: gist را انتخاب کنید\n5. Token را کپی و اینجا وارد کنید\n\n💡 نکته: اگر تنظیمات قبلی دارید، کلید Cancel را بزنید');
            
            if (!token) {
                showToast('عملیات لغو شد. اگر تنظیمات قبلی دارید، از دکمه "🔄 تست اتصال GitHub" استفاده کنید', 'info');
                return;
            }
            
            // درخواست Gist ID
            const gistId = prompt('لطفاً ID گیست GitHub را وارد کنید:\n\nراهنما:\n1. gist.github.com بروید\n2. گیست جدید بسازید یا گیست موجود را باز کنید\n3. URL گیست را کپی کنید (مثل: https://gist.github.com/username/abc123def456)\n4. ID گیست (abc123def456) را اینجا وارد کنید');
            
            if (!gistId) return;
            
            // تست اتصال
            testGitHubConnection(token, gistId);
        }
        
        // تابع تست اتصال GitHub با تنظیمات موجود
        function testGitHubConnectionWithSavedConfig() {
            const savedConfig = localStorage.getItem('elishoes_cloud_sync');
            
            if (!savedConfig) {
                alert('ابتدا GitHub را تنظیم کنید');
                return;
            }
            
            const config = JSON.parse(savedConfig);
            if (!config.enabled || config.provider !== 'github' || !config.config) {
                alert('تنظیمات GitHub نامعتبر است. لطفاً دوباره تنظیم کنید');
                return;
            }
            
            showToast('در حال تست اتصال...', 'info');
            testGitHubConnection(config.config.token, config.config.gistId);
        }
        
        // تست اتصال گیت هاب
        function testGitHubConnection(token, gistId) {
            fetch(`https://api.github.com/gists/${gistId}`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error(`خطا در اتصال: ${response.status} ${response.statusText}`);
                }
            })
            .then(gist => {
                // ذخیره تنظیمات
                cloudSync.enabled = true;
                cloudSync.provider = 'github';
                cloudSync.config = {
                    token: token,
                    gistId: gistId,
                    username: gist.owner?.login || 'Unknown'
                };
                cloudSync.lastSync = new Date().toISOString();
                
                localStorage.setItem('elishoes_cloud_sync', JSON.stringify(cloudSync));
                updateSyncStatus();
                
                // نمایش موفقیت
                const message = `✅ اتصال GitHub با موفقیت برقرار شد!

👤 کاربر: ${gist.owner?.login || 'Unknown'}
📝 نام گیست: ${gist.description || 'بدون توضیحات'}
🔗 گیست ID: ${gistId}

حالا می‌توانید همگام‌سازی داده‌ها را انجام دهید.`;
                
                showToast(message, 'success');
                updateSyncStatus();
            })
            .catch(error => {
                console.error('GitHub connection error:', error);
                alert(`❌ خطا در اتصال به GitHub:\n\n${error.message}\n\nلطفاً Token و Gist ID را بررسی کنید و دوباره تلاش کنید.`);
            });
        }
        
        // همگام‌سازی به گیت هاب
        function syncToGitHub() {
            if (!cloudSync.enabled || cloudSync.provider !== 'github') {
                alert('لطفاً ابتدا GitHub را تنظیم کنید');
                return;
            }
            
            const config = cloudSync.config;
            if (!config || !config.token || !config.gistId) {
                alert('تنظیمات GitHub نامعتبر است. لطفاً دوباره تنظیم کنید.');
                return;
            }
            
            // جمع‌آوری داده‌ها
            const data = {
                elishoes_data: {
                    inventory: getInventory(),
                    sales151: getSales151(),
                    sales168: getSales168(),
                    invoices: getAllInvoices(),
                    lastUpdated: new Date().toISOString(),
                    version: '1.0'
                }
            };
            
            // بارگذاری گیست فعلی
            fetch(`https://api.github.com/gists/${config.gistId}`, {
                headers: {
                    'Authorization': `token ${config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`خطا در بارگذاری گیست: ${response.status}`);
                }
                return response.json();
            })
            .then(gist => {
                // بروزرسانی گیست
                const updatedGist = {
                    description: 'EliShoes - Backup of inventory and sales data',
                    files: {
                        'elishoes_data.json': {
                            content: JSON.stringify(data, null, 2)
                        }
                    }
                };
                
                return fetch(`https://api.github.com/gists/${config.gistId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `token ${config.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedGist)
                });
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`خطا در همگام‌سازی: ${response.status}`);
                }
                return response.json();
            })
            .then(result => {
                cloudSync.lastSync = new Date().toISOString();
                localStorage.setItem('elishoes_cloud_sync', JSON.stringify(cloudSync));
                updateSyncStatus();
                
                showToast('✅ داده‌ها با موفقیت در GitHub ذخیره شدند', 'success');
            })
            .catch(error => {
                console.error('GitHub sync error:', error);
                alert(`❌ خطا در همگام‌سازی:\n\n${error.message}\n\nلطفاً اتصال اینترنت و تنظیمات را بررسی کنید.`);
            });
        }
        
        // همگام‌سازی از گیت هاب
        function syncFromGitHub() {
            if (!cloudSync.enabled || cloudSync.provider !== 'github') {
                alert('لطفاً ابتدا GitHub را تنظیم کنید');
                return;
            }
            
            const config = cloudSync.config;
            if (!config || !config.token || !config.gistId) {
                alert('تنظیمات GitHub نامعتبر است. لطفاً دوباره تنظیم کنید.');
                return;
            }
            
            // بارگذاری از گیت
            fetch(`https://api.github.com/gists/${config.gistId}`, {
                headers: {
                    'Authorization': `token ${config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`خطا در بارگذاری گیست: ${response.status}`);
                }
                return response.json();
            })
            .then(gist => {
                const dataFile = gist.files['elishoes_data.json'];
                if (!dataFile) {
                    throw new Error('فایل داده در گیست یافت نشد');
                }
                
                // دانلود محتوای فایل
                return fetch(dataFile.raw_url);
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('خطا در دانلود داده‌ها');
                }
                return response.json();
            })
            .then(data => {
                if (!data.elishoes_data) {
                    throw new Error('فرمت داده نامعتبر است');
                }
                
                // بازگردانی داده‌ها
                restoreFromData(data.elishoes_data);
                
                cloudSync.lastSync = new Date().toISOString();
                localStorage.setItem('elishoes_cloud_sync', JSON.stringify(cloudSync));
                updateSyncStatus();
                
                // بروزرسانی رابط
                refreshInventory();
                renderEntryInvoices();
                renderSales151Invoices();
                renderSales168Invoices();
                updateProductSelects();
                updateSystemInfo();
                
                showToast('✅ داده‌ها از GitHub با موفقیت بازیابی شدند', 'success');
            })
            .catch(error => {
                console.error('GitHub sync error:', error);
                alert(`❌ خطا در بازیابی:\n\n${error.message}\n\nلطفاً اتصال اینترنت و تنظیمات را بررسی کنید.`);
            });
        }
        
        // بهبود LocalStorage
        function setupLocalStorageBackup() {
            // فعال‌سازی backup خودکار
            autoBackupConfig.enabled = true;
            autoBackupConfig.lastBackup = new Date().toISOString();
            
            // ذخیره تنظیمات
            localStorage.setItem('elishoes_autobackup', JSON.stringify(autoBackupConfig));
            
            // شروع backup خودکار
            setInterval(() => {
                if (autoBackupConfig.enabled) {
                    createBackup();
                }
            }, autoBackupConfig.interval);
            
            cloudSync.enabled = true;
            cloudSync.provider = 'localStorage';
            cloudSync.lastSync = new Date().toISOString();
            
            localStorage.setItem('elishoes_cloud_sync', JSON.stringify(cloudSync));
            
            // به‌روزرسانی status
            updateSyncStatus();
            showToast('پشتیبان‌گیری خودکار فعال شد (هر ساعت)');
        }
        
        // به‌روزرسانی وضعیت همگام‌سازی
        function updateSyncStatus() {
            const statusEl = document.getElementById('sync-status');
            const githubSection = document.getElementById('github-sync-section');
            const savedConfig = localStorage.getItem('elishoes_cloud_sync');
            
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                if (config.enabled && config.provider) {
                    statusEl.className = 'sync-status online';
                    statusEl.textContent = 'وضعیت همگام‌سازی: آنلاین (' + getProviderName(config.provider) + ')';
                    
                    // نمایش بخش GitHub اگر GitHub تنظیم شده باشد
                    if (config.provider === 'github' && config.config) {
                        githubSection.style.display = 'block';
                    } else {
                        githubSection.style.display = 'none';
                    }
                    return;
                }
            }
            
            statusEl.className = 'sync-status offline';
            statusEl.textContent = 'وضعیت همگام‌سازی: آفلاین (فقط LocalStorage)';
            githubSection.style.display = 'none';
        }
        
        // نام ارائه‌دهنده
        function getProviderName(provider) {
            const names = {
                'firebase': 'Firebase',
                'supabase': 'Supabase',
                'github': 'GitHub',
                'localStorage': 'LocalStorage Enhanced'
            };
            return names[provider] || provider;
        }
        
        // ========== پایان مدیریت داده ==========
        
        // تابع نمایش تب
        function showTab(tabName) {
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
            document.getElementById(tabName).classList.add('active');
            
            if (tabName === 'inventory') {
                refreshInventory();
            } else if (tabName === 'entry') {
                updateEntryProductSelect();
            } else if (tabName === 'sales151' || tabName === 'sales168') {
                updateProductSelects();
            } else if (tabName === 'data-management') {
                updateSystemInfo();
                updateSyncStatus();
            }
        }

        // تابع نمایش پیام
        function showToast(message, type = 'success') {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.className = `toast ${type} show`;
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }

        // تابع تبدیل تاریخ به فرمت شمسی
        function formatPersianDate(dateString) {
            if (!dateString) return new Date().toLocaleDateString('fa-IR');
            const date = new Date(dateString);
            return date.toLocaleDateString('fa-IR');
        }

        // تابع نمایش آیتم‌های فاکتور (معمولی یا قابل ویرایش)
        function renderInvoiceItems(items, type, invoiceIndex) {
            if (editingInvoice?.type === type && editingInvoice?.index === invoiceIndex) {
                // حالت ویرایش
                return items.map((item, itemIndex) => `
                    <div class="invoice-item">
                        <div class="invoice-item-edit">
                            <span>${item.name} - ${item.color}</span>
                            <input type="number" min="1" value="${item.quantity}" 
                                   id="edit-${type}-${invoiceIndex}-${itemIndex}" 
                                   onchange="validateEditQuantity('${type}', ${invoiceIndex}, ${itemIndex}, this.value)">
                            <span>عدد</span>
                            <button class="btn btn-danger" onclick="removeInvoiceItem('${type}', ${invoiceIndex}, ${itemIndex})">🗑️ حذف</button>
                        </div>
                    </div>
                `).join('');
            } else {
                // حالت نمایش
                return items.map(item => `
                    <div class="invoice-item">
                        <div class="invoice-item-view">
                            <span>${item.name} - ${item.color}</span>
                            <span>${item.quantity} عدد</span>
                        </div>
                    </div>
                `).join('');
            }
        }

        // توابع مدیریت آیتم‌های موقت ورودی
        function renderTempEntryItems() {
            const tbody = document.getElementById('entry-temp-body');
            tbody.innerHTML = tempEntryItems.map((item, index) => `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.color}</td>
                    <td>${item.quantity}</td>
                    <td>${formatPersianDate(item.invoiceDate)}</td>
                    <td><button class="btn btn-danger" onclick="removeTempEntryItem(${index})">🗑️ حذف</button></td>
                </tr>
            `).join('');
        }

        function removeTempEntryItem(index) {
            tempEntryItems.splice(index, 1);
            if (tempEntryItems.length === 0) {
                document.getElementById('entry-temp-list').classList.add('hidden');
            } else {
                renderTempEntryItems();
            }
        }

        // مدیریت ورودی
        function addEntry(targetInvoiceId = null) {
            const select = document.getElementById('entry-product-select').value;
            const name = document.getElementById('entry-product-name').value.trim();
            const color = document.getElementById('entry-product-color').value.trim();
            const quantity = parseInt(document.getElementById('entry-quantity').value);
            const rawDate = document.getElementById('entry-invoice-date').value;
            const invoiceDate = rawDate || new Date().toISOString().split('T')[0];

            if (!name || !color || quantity <= 0) {
                showToast('لطفاً تمام فیلدها را پر کنید', 'error');
                return;
            }

            // جستجوی محصول موجود
            let product = products.find(p => p.name === name && p.color === color);
            
            if (!product) {
                // محصول جدید
                product = {
                    id: Date.now(),
                    name: name,
                    color: color,
                    entry: 0,
                    sales151: 0,
                    sales168: 0
                };
                products.push(product);
                // بروزرسانی لیست محصولات در فرم
                updateEntryProductSelect();
            }

            // استفاده از targetInvoiceId ارسال شده یا currentAddTarget
            const invoiceId = targetInvoiceId || (currentAddTarget?.type === 'entry' ? currentAddTarget.invoiceId : null);
            
            if (invoiceId) {
                // افزودن به فاکتور موجود
                const invoice = entryInvoices.find(inv => inv.id == invoiceId);
                if (invoice) {
                    invoice.items.push({
                        name: name,
                        color: color,
                        quantity: quantity
                    });
                    
                    // بروزرسانی موجودی
                    const prod = products.find(p => p.name === name && p.color === color);
                    if (prod) {
                        prod.entry += quantity;
                    }
                    
                    // ذخیره تغییرات
                    localStorage.setItem('entryInvoices', JSON.stringify(entryInvoices));
                    localStorage.setItem('products', JSON.stringify(products));
                    
                    // backup خودکار
                    autoBackup();
                    
                    // پاک کردن فرم
                    clearEntryForm();
                    updateEntryProductSelect();
                    
                    // رندر مجدد
                    renderEntryInvoices();
                    refreshInventory();
                    updateProductSelects();
                    
                    showToast('محصول به فاکتور اضافه شد');
                } else {
                    showToast('فاکتور مورد نظر یافت نشد', 'error');
                }
            } else {
                // افزودن به لیست موقت (برای فاکتور جدید)
                tempEntryItems.push({
                    productId: product.id,
                    name: name,
                    color: color,
                    quantity: quantity,
                    invoiceDate: invoiceDate  // ذخیره تاریخ در آیتم موقت
                });

                // پاک کردن فرم
                clearEntryForm();
                updateEntryProductSelect();

                // نمایش لیست موقت
                document.getElementById('entry-temp-list').classList.remove('hidden');
                renderTempEntryItems();

                showToast('محصول به لیست ورودی اضافه شد');
            }
        }



        function saveEntry() {
            if (tempEntryItems.length === 0) return;

            // استفاده از تاریخ اولین آیتم (چون همه آیتم‌ها باید همان تاریخ داشته باشند)
            const invoiceDate = tempEntryItems[0].invoiceDate || new Date().toISOString().split('T')[0];
            
            const invoice = {
                id: Date.now(),
                date: invoiceDate,  // استفاده از تاریخ انتخاب شده
                items: tempEntryItems.map(item => ({
                    name: item.name,
                    color: item.color,
                    quantity: item.quantity
                }))
            };

            entryInvoices.push(invoice);
            localStorage.setItem('entryInvoices', JSON.stringify(entryInvoices));

            // بروزرسانی موجودی محصولات
            tempEntryItems.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    product.entry += item.quantity;
                }
            });

            localStorage.setItem('products', JSON.stringify(products));
            
            // backup خودکار
            autoBackup();

            // پاک کردن لیست موقت
            tempEntryItems = [];
            document.getElementById('entry-temp-list').classList.add('hidden');

            renderEntryInvoices();
            showToast('فاکتور ورودی ذخیره شد');

            // بروزرسانی select در تب‌های فروش
            updateProductSelects();
        }

        function cancelEntry() {
            tempEntryItems = [];
            document.getElementById('entry-temp-list').classList.add('hidden');
            clearEntryForm();
            updateEntryProductSelect();
        }

        function renderEntryInvoices() {
            const container = document.getElementById('entry-invoices');
            if (entryInvoices.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #666;">هیچ فاکتور ورودی وجود ندارد</p>';
                return;
            }

            container.innerHTML = entryInvoices.map((invoice, index) => `
                <div class="invoice-card">
                    <div class="invoice-header">
                        <div>
                            <strong>فاکتور ورودی #${invoice.id}</strong>
                            ${editingInvoice?.type === 'entry' && editingInvoice?.index === index ? 
                                `<input type="date" id="edit-invoice-date-entry-${index}" value="${persianDateToInput(invoice.date)}" style="margin-right: 10px; padding: 5px;">` :
                                `<span class="invoice-date">${formatPersianDate(invoice.date)}</span>`
                            }
                        </div>
                        <div class="invoice-actions">
                            ${editingInvoice?.type === 'entry' && editingInvoice?.index === index ? 
                                `<button class="btn btn-success" onclick="saveInvoiceEdit()">💾 ذخیره</button>
                                 <button class="btn btn-secondary" onclick="cancelInvoiceEdit()">❌ لغو</button>
                                 <button class="btn btn-info" onclick="addItemToInvoice('entry', ${index})">➕ افزودن محصول</button>` :
                                `<button class="btn btn-secondary" onclick="editInvoice(\'entry\', ${index})">✏️ ویرایش</button>
                                 <button class="btn btn-danger" onclick="deleteInvoice('entry', ${index})">🗑️ حذف فاکتور</button>`
                            }
                        </div>
                    </div>
                    <div class="invoice-items" id="entry-invoice-${index}">
                        ${renderInvoiceItems(invoice.items, 'entry', index)}
                    </div>
                </div>
            `).join('');
        }

        // توابع ویرایش فاکتور
        function editInvoice(type, index) {
            // لغو ویرایش قبلی اگر وجود داشته باشد
            if (editingInvoice) {
                cancelInvoiceEdit();
            }
            
            editingInvoice = { type, index };
            
            // رندر مجدد برای نمایش حالت ویرایش
            if (type === 'entry') {
                renderEntryInvoices();
            } else if (type === 'sales151') {
                renderSales151Invoices();
            } else if (type === 'sales168') {
                renderSales168Invoices();
            }
        }

        function cancelInvoiceEdit() {
            editingInvoice = null;
            renderEntryInvoices();
            renderSales151Invoices();
            renderSales168Invoices();
        }

        function saveInvoiceEdit() {
            if (!editingInvoice) return;

            const { type, index } = editingInvoice;
            let invoice;
            
            if (type === 'entry') {
                invoice = entryInvoices[index];
            } else if (type === 'sales151') {
                invoice = salesInvoices151[index];
            } else if (type === 'sales168') {
                invoice = salesInvoices168[index];
            }

            if (!invoice) return;

            // بروزرسانی تاریخ
            const dateInput = document.getElementById(`edit-invoice-date-${type}-${index}`);
            if (dateInput) {
                invoice.date = dateInput.value || invoice.date;
            }

            // اعتبارسنجی فروش بر اساس موجودی
            if (type === 'sales151' || type === 'sales168') {
                for (let itemIndex = 0; itemIndex < invoice.items.length; itemIndex++) {
                    const item = invoice.items[itemIndex];
                    const newQuantity = parseInt(document.getElementById(`edit-${type}-${index}-${itemIndex}`).value) || item.quantity;
                    
                    if (newQuantity > 0) {
                        const product = products.find(p => p.name === item.name && p.color === item.color);
                        if (product) {
                            const currentStock = getStock(product);
                            if (newQuantity > currentStock + item.quantity) {
                                showToast(`موجودی ${item.name} - ${item.color} کافی نیست`, 'error');
                                return;
                            }
                        }
                    }
                }
            }

            // بروزرسانی آیتم‌ها از فیلدهای ویرایش
            invoice.items = invoice.items.map((item, itemIndex) => {
                const input = document.getElementById(`edit-${type}-${index}-${itemIndex}`);
                if (input) {
                    return {
                        ...item,
                        quantity: parseInt(input.value) || item.quantity
                    };
                }
                return item;
            }).filter(item => item.quantity > 0);

            // ذخیره در localStorage
            if (type === 'entry') {
                localStorage.setItem('entryInvoices', JSON.stringify(entryInvoices));
            } else if (type === 'sales151') {
                localStorage.setItem('salesInvoices151', JSON.stringify(salesInvoices151));
            } else if (type === 'sales168') {
                localStorage.setItem('salesInvoices168', JSON.stringify(salesInvoices168));
            }
            
            // backup خودکار
            autoBackup();

            // بروزرسانی موجودی محصولات
            updateProductQuantities(type, index);

            // لغو ویرایش و رندر مجدد
            editingInvoice = null;
            renderEntryInvoices();
            renderSales151Invoices();
            renderSales168Invoices();
            refreshInventory();
            updateProductSelects();

            showToast('فاکتور با موفقیت ویرایش شد');
        }

        function removeInvoiceItem(type, invoiceIndex, itemIndex) {
            let invoices;
            if (type === 'entry') {
                invoices = entryInvoices;
            } else if (type === 'sales151') {
                invoices = salesInvoices151;
            } else if (type === 'sales168') {
                invoices = salesInvoices168;
            }

            if (!invoices || !invoices[invoiceIndex]) return;

            invoices[invoiceIndex].items.splice(itemIndex, 1);

            // اگر فاکتور خالی شد، آن را حذف کن
            if (invoices[invoiceIndex].items.length === 0) {
                invoices.splice(invoiceIndex, 1);
            }

            // ذخیره در localStorage
            if (type === 'entry') {
                localStorage.setItem('entryInvoices', JSON.stringify(entryInvoices));
            } else if (type === 'sales151') {
                localStorage.setItem('salesInvoices151', JSON.stringify(salesInvoices151));
            } else if (type === 'sales168') {
                localStorage.setItem('salesInvoices168', JSON.stringify(salesInvoices168));
            }
            
            // backup خودکار
            autoBackup();

            // رندر مجدد
            renderEntryInvoices();
            renderSales151Invoices();
            renderSales168Invoices();
            refreshInventory();
            updateProductSelects();

            showToast('آیتم از فاکتور حذف شد');
        }

        function deleteInvoice(type, invoiceIndex) {
            if (!confirm('آیا مطمئن هستید که می‌خواهید این فاکتور را حذف کنید؟')) {
                return;
            }

            let invoices;
            if (type === 'entry') {
                invoices = entryInvoices;
            } else if (type === 'sales151') {
                invoices = salesInvoices151;
            } else if (type === 'sales168') {
                invoices = salesInvoices168;
            }

            if (!invoices || !invoices[invoiceIndex]) return;

            // حذف فاکتور
            invoices.splice(invoiceIndex, 1);

            // ذخیره در localStorage
            if (type === 'entry') {
                localStorage.setItem('entryInvoices', JSON.stringify(entryInvoices));
            } else if (type === 'sales151') {
                localStorage.setItem('salesInvoices151', JSON.stringify(salesInvoices151));
            } else if (type === 'sales168') {
                localStorage.setItem('salesInvoices168', JSON.stringify(salesInvoices168));
            }
            
            // backup خودکار
            autoBackup();

            // بروزرسانی موجودی محصولات
            updateProductQuantities();

            // لغو ویرایش و رندر مجدد
            editingInvoice = null;
            renderEntryInvoices();
            renderSales151Invoices();
            renderSales168Invoices();
            refreshInventory();
            updateProductSelects();

            showToast('فاکتور با موفقیت حذف شد');
        }

        function addItemToInvoice(type, invoiceIndex) {
            // باز کردن فرم افزودن محصول برای فاکتور
            const invoiceId = type === 'entry' ? 
                entryInvoices[invoiceIndex]?.id : 
                type === 'sales151' ? 
                salesInvoices151[invoiceIndex]?.id : 
                salesInvoices168[invoiceIndex]?.id;
            
            if (!invoiceId) {
                showToast('فاکتور یافت نشد', 'error');
                return;
            }

            // ایجاد متغیر سراسری برای ذخیره هدف فعلی
            currentAddTarget = { type, invoiceId };

            // فعال کردن فرم افزودن محصول مناسب
            if (type === 'entry') {
                showAddProductForm('entry', invoiceId);
            } else if (type === 'sales151') {
                showAddProductForm('sales151', invoiceId);
            } else if (type === 'sales168') {
                showAddProductForm('sales168', invoiceId);
            }

            showToast('فرم افزودن محصول باز شد - محصولات به این فاکتور اضافه خواهند شد');
        }

        function showAddProductForm(type, targetInvoiceId = null) {
            // لغو ویرایش فعلی
            editingInvoice = null;

            // نمایش فرم مناسب
            if (type === 'entry') {
                const form = document.getElementById('add-product-form-entry');
                if (form.style.display === 'none' || !form.style.display) {
                    form.style.display = 'block';
                    currentAddTarget = targetInvoiceId ? { type, invoiceId: targetInvoiceId } : null;
                } else {
                    form.style.display = 'none';
                    currentAddTarget = null;
                }
            } else if (type === 'sales151') {
                const form = document.getElementById('add-product-form-sales151');
                if (form.style.display === 'none' || !form.style.display) {
                    form.style.display = 'block';
                    currentAddTarget = targetInvoiceId ? { type, invoiceId: targetInvoiceId } : null;
                } else {
                    form.style.display = 'none';
                    currentAddTarget = null;
                }
            } else if (type === 'sales168') {
                const form = document.getElementById('add-product-form-sales168');
                if (form.style.display === 'none' || !form.style.display) {
                    form.style.display = 'block';
                    currentAddTarget = targetInvoiceId ? { type, invoiceId: targetInvoiceId } : null;
                } else {
                    form.style.display = 'none';
                    currentAddTarget = null;
                }
            }
        }

        function validateEditQuantity(type, invoiceIndex, itemIndex, value) {
            const quantity = parseInt(value);
            if (quantity < 1) {
                document.getElementById(`edit-${type}-${invoiceIndex}-${itemIndex}`).value = 1;
                showToast('تعداد نمی‌تواند کمتر از ۱ باشد', 'error');
            }
        }

        function updateProductQuantities(type, invoiceIndex) {
            // بازسازی کامل موجودی محصولات
            products.forEach(product => {
                product.entry = 0;
                product.sales151 = 0;
                product.sales168 = 0;
            });

            // محاسبه ورودی‌ها
            entryInvoices.forEach(invoice => {
                invoice.items.forEach(item => {
                    const product = products.find(p => p.name === item.name && p.color === item.color);
                    if (product) {
                        product.entry += item.quantity;
                    }
                });
            });

            // محاسبه فروش ۱۵۱
            salesInvoices151.forEach(invoice => {
                invoice.items.forEach(item => {
                    const product = products.find(p => p.name === item.name && p.color === item.color);
                    if (product) {
                        product.sales151 += item.quantity;
                    }
                });
            });

            // محاسبه فروش ۱۶۸
            salesInvoices168.forEach(invoice => {
                invoice.items.forEach(item => {
                    const product = products.find(p => p.name === item.name && p.color === item.color);
                    if (product) {
                        product.sales168 += item.quantity;
                    }
                });
            });

            localStorage.setItem('products', JSON.stringify(products));
        }

        
        // ========== توابع کمکی ==========
        
        // تابع backup خودکار
        function autoBackup() {
            if (autoBackupConfig.enabled) {
                const now = new Date().getTime();
                const lastBackup = autoBackupConfig.lastBackup ? new Date(autoBackupConfig.lastBackup).getTime() : 0;
                
                if (now - lastBackup >= autoBackupConfig.interval) {
                    createBackup();
                    autoBackupConfig.lastBackup = now.toISOString();
                    localStorage.setItem('elishoes_autobackup', JSON.stringify(autoBackupConfig));
                }
            }
        }
        
        // ========== مدیریت ورودی محصولات ==========
        function updateEntryProductSelect() {
            const select = document.getElementById('entry-product-select');
            
            const existingProducts = products.map(product => 
                `<option value="${product.id}">${product.name} - ${product.color} (موجودی فعلی: ${getStock(product)})</option>`
            ).join('');
            
            select.innerHTML = '<option value="">انتخاب محصول موجود یا محصول جدید</option>' +
                              '<option value="new">➕ محصول جدید</option>' +
                              existingProducts;
        }

        function onEntryProductSelect() {
            const select = document.getElementById('entry-product-select');
            const productName = document.getElementById('entry-product-name');
            const productColor = document.getElementById('entry-product-color');
            
            if (select.value === 'new') {
                // محصول جدید - فیلدها را خالی می‌کنیم
                productName.value = '';
                productColor.value = '';
                productName.focus();
            } else if (select.value) {
                // محصول موجود - فیلدها را پر می‌کنیم
                const product = products.find(p => p.id == select.value);
                if (product) {
                    productName.value = product.name;
                    productColor.value = product.color;
                    productName.focus();
                }
            }
        }

        function clearEntryForm() {
            document.getElementById('entry-product-select').value = '';
            document.getElementById('entry-product-name').value = '';
            document.getElementById('entry-product-color').value = '';
            document.getElementById('entry-quantity').value = '1';
            setDefaultInvoiceDate();
        }

        // تبدیل تاریخ میلادی به شمسی
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
        
        function convertGregorianToPersian(gregorianDate) {
            const date = new Date(gregorianDate);
            const persian = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
            const year = persian.year;
            const month = String(persian.month).padStart(2, '0');
            const day = String(persian.day).padStart(2, '0');
            return `${year}/${month}/${day}`;
        }
        
        // تابع کمکی برای تبدیل تاریخ شمسی به فرمت ورودی
        function persianDateToInput(dateString) {
            if (!dateString) return new Date().toISOString().split('T')[0];
            return dateString;
        }
            
            // اگر فرمت شمسی باشد (1404/08/13)، تبدیل به فرمت ورودی
            if (dateString.includes('/')) {
                const parts = dateString.split('/');
                if (parts.length === 3) {
                    return `${parts[0]}-${parts[1]}-${parts[2]}`;
                }
            }
            
            return dateString;
        }
        
        // تابع کمکی برای تبدیل فرمت ورودی به تاریخ شمسی
        function inputDateToPersian(dateValue) {
            if (!dateValue) return '';
            
            // اگر فرمت تاریخ HTML باشد (1404-08-13)
            if (dateValue.includes('-')) {
                const parts = dateValue.split('-');
                if (parts.length === 3) {
                    return `${parts[0]}/${parts[1]}/${parts[2]}`;
                }
            }
            
            return dateValue;
        }

        function setDefaultInvoiceDate() {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('entry-invoice-date').value = today;
        }
        
        // ========== مدیریت فروش ۱۵۱ ==========
        function updateProductSelects() {
            const select151 = document.getElementById('sales151-product');
            const select168 = document.getElementById('sales168-product');
            
            const options = products.map(product => 
                `<option value="${product.id}">${product.name} - ${product.color} (موجودی: ${getStock(product)})</option>`
            ).join('');

            select151.innerHTML = '<option value="">انتخاب محصول</option>' + options;
            select168.innerHTML = '<option value="">انتخاب محصول</option>' + options;
        }

        function getStock(product) {
            return product.entry - product.sales151 - product.sales168;
        }

        function updateStock151() {
            const productId = parseInt(document.getElementById('sales151-product').value);
            const product = products.find(p => p.id === productId);
            const stock = product ? getStock(product) : 0;
            document.getElementById('stock151').value = stock;
        }

        function updateStock168() {
            const productId = parseInt(document.getElementById('sales168-product').value);
            const product = products.find(p => p.id === productId);
            const stock = product ? getStock(product) : 0;
            document.getElementById('stock168').value = stock;
        }

        function addSales151(targetInvoiceId = null) {
            const productId = parseInt(document.getElementById('sales151-product').value);
            const quantity = parseInt(document.getElementById('sales151-quantity').value);
            const product = products.find(p => p.id === productId);

            if (!product || quantity <= 0) {
                showToast('لطفاً محصول و تعداد را انتخاب کنید', 'error');
                return;
            }

            const stock = getStock(product);
            if (quantity > stock) {
                showToast('موجودی کافی نیست', 'error');
                return;
            }

            // استفاده از targetInvoiceId ارسال شده یا currentAddTarget
            const invoiceId = targetInvoiceId || (currentAddTarget?.type === 'sales151' ? currentAddTarget.invoiceId : null);
            
            if (invoiceId) {
                // افزودن به فاکتور موجود
                const invoice = salesInvoices151.find(inv => inv.id == invoiceId);
                if (invoice) {
                    invoice.items.push({
                        name: product.name,
                        color: product.color,
                        quantity: quantity
                    });
                    
                    // بروزرسانی موجودی
                    product.sales151 += quantity;
                    
                    // ذخیره تغییرات
                    localStorage.setItem('salesInvoices151', JSON.stringify(salesInvoices151));
                    localStorage.setItem('products', JSON.stringify(products));
                    
                    // backup خودکار
                    autoBackup();
                    
                    // پاک کردن فرم
                    document.getElementById('sales151-product').value = '';
                    document.getElementById('stock151').value = '';
                    document.getElementById('sales151-quantity').value = '1';
                    
                    // رندر مجدد
                    renderSales151Invoices();
                    refreshInventory();
                    updateProductSelects();
                    
                    showToast('محصول به فاکتور اضافه شد');
                } else {
                    showToast('فاکتور مورد نظر یافت نشد', 'error');
                }
            } else {
                // افزودن به لیست موقت (برای فاکتور جدید)
                tempSales151Items.push({
                    productId: productId,
                    name: product.name,
                    color: product.color,
                    quantity: quantity
                });

                document.getElementById('sales151-product').value = '';
                document.getElementById('stock151').value = '';
                document.getElementById('sales151-quantity').value = '1';

                document.getElementById('sales151-temp-list').classList.remove('hidden');
                renderTempSales151Items();

                showToast('محصول به لیست فروش اضافه شد');
            }
        }

        function renderTempSales151Items() {
            const tbody = document.getElementById('sales151-temp-body');
            tbody.innerHTML = tempSales151Items.map((item, index) => `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.color}</td>
                    <td>${item.quantity}</td>
                    <td><button class="btn btn-danger" onclick="removeTempSales151Item(${index})">🗑️ حذف</button></td>
                </tr>
            `).join('');
        }

        function removeTempSales151Item(index) {
            tempSales151Items.splice(index, 1);
            if (tempSales151Items.length === 0) {
                document.getElementById('sales151-temp-list').classList.add('hidden');
            } else {
                renderTempSales151Items();
            }
        }

        function saveSales151() {
            if (tempSales151Items.length === 0) return;

            const invoice = {
                id: Date.now(),
                date: new Date().toISOString(),
                items: [...tempSales151Items]
            };

            salesInvoices151.push(invoice);
            localStorage.setItem('salesInvoices151', JSON.stringify(salesInvoices151));

            // بروزرسانی موجودی محصولات
            tempSales151Items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    product.sales151 += item.quantity;
                }
            });

            localStorage.setItem('products', JSON.stringify(products));
            
            // backup خودکار
            autoBackup();

            tempSales151Items = [];
            document.getElementById('sales151-temp-list').classList.add('hidden');
            renderSales151Invoices();
            showToast('فاکتور فروش ۱۵۱ ثبت شد');

            // بروزرسانی select
            updateProductSelects();
        }

        function cancelSales151() {
            tempSales151Items = [];
            document.getElementById('sales151-temp-list').classList.add('hidden');
        }

        function renderSales151Invoices() {
            const container = document.getElementById('sales151-invoices');
            if (salesInvoices151.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #666;">هیچ فاکتور فروش ۱۵۱ وجود ندارد</p>';
                return;
            }

            container.innerHTML = salesInvoices151.map((invoice, index) => `
                <div class="invoice-card">
                    <div class="invoice-header">
                        <div>
                            <strong>فاکتور فروش ۱۵۱ #${invoice.id}</strong>
                            ${editingInvoice?.type === 'sales151' && editingInvoice?.index === index ? 
                                `<input type="date" id="edit-invoice-date-${type}-${index}" value="${persianDateToInput(invoice.date)}" style="margin-right: 10px; padding: 5px;">` :
                                `<span class="invoice-date">${formatPersianDate(invoice.date)}</span>`
                            }
                        </div>
                        <div class="invoice-actions">
                            ${editingInvoice?.type === 'sales151' && editingInvoice?.index === index ? 
                                `<button class="btn btn-success" onclick="saveInvoiceEdit()">💾 ذخیره</button>
                                 <button class="btn btn-secondary" onclick="cancelInvoiceEdit()">❌ لغو</button>
                                 <button class="btn btn-info" onclick="addItemToInvoice('sales151', ${index})">➕ افزودن محصول</button>` :
                                `<button class="btn btn-secondary" onclick="editInvoice(\'sales151\', ${index})">✏️ ویرایش</button>
                                 <button class="btn btn-danger" onclick="deleteInvoice('sales151', ${index})">🗑️ حذف فاکتور</button>`
                            }
                        </div>
                    </div>
                    <div class="invoice-items" id="sales151-invoice-${index}">
                        ${renderInvoiceItems(invoice.items, 'sales151', index)}
                    </div>
                </div>
            `).join('');
        }

        // مدیریت فروش ۱۶۸
        function addSales168(targetInvoiceId = null) {
            const productId = parseInt(document.getElementById('sales168-product').value);
            const quantity = parseInt(document.getElementById('sales168-quantity').value);
            const product = products.find(p => p.id === productId);

            if (!product || quantity <= 0) {
                showToast('لطفاً محصول و تعداد را انتخاب کنید', 'error');
                return;
            }

            const stock = getStock(product);
            if (quantity > stock) {
                showToast('موجودی کافی نیست', 'error');
                return;
            }

            // استفاده از targetInvoiceId ارسال شده یا currentAddTarget
            const invoiceId = targetInvoiceId || (currentAddTarget?.type === 'sales168' ? currentAddTarget.invoiceId : null);
            
            if (invoiceId) {
                // افزودن به فاکتور موجود
                const invoice = salesInvoices168.find(inv => inv.id == invoiceId);
                if (invoice) {
                    invoice.items.push({
                        name: product.name,
                        color: product.color,
                        quantity: quantity
                    });
                    
                    // بروزرسانی موجودی
                    product.sales168 += quantity;
                    
                    // ذخیره تغییرات
                    localStorage.setItem('salesInvoices168', JSON.stringify(salesInvoices168));
                    localStorage.setItem('products', JSON.stringify(products));
                    
                    // backup خودکار
                    autoBackup();
                    
                    // پاک کردن فرم
                    document.getElementById('sales168-product').value = '';
                    document.getElementById('stock168').value = '';
                    document.getElementById('sales168-quantity').value = '1';
                    
                    // رندر مجدد
                    renderSales168Invoices();
                    refreshInventory();
                    updateProductSelects();
                    
                    showToast('محصول به فاکتور اضافه شد');
                } else {
                    showToast('فاکتور مورد نظر یافت نشد', 'error');
                }
            } else {
                // افزودن به لیست موقت (برای فاکتور جدید)
                tempSales168Items.push({
                    productId: productId,
                    name: product.name,
                    color: product.color,
                    quantity: quantity
                });

                document.getElementById('sales168-product').value = '';
                document.getElementById('stock168').value = '';
                document.getElementById('sales168-quantity').value = '1';

                document.getElementById('sales168-temp-list').classList.remove('hidden');
                renderTempSales168Items();

                showToast('محصول به لیست فروش اضافه شد');
            }
        }

        function renderTempSales168Items() {
            const tbody = document.getElementById('sales168-temp-body');
            tbody.innerHTML = tempSales168Items.map((item, index) => `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.color}</td>
                    <td>${item.quantity}</td>
                    <td><button class="btn btn-danger" onclick="removeTempSales168Item(${index})">🗑️ حذف</button></td>
                </tr>
            `).join('');
        }

        function removeTempSales168Item(index) {
            tempSales168Items.splice(index, 1);
            if (tempSales168Items.length === 0) {
                document.getElementById('sales168-temp-list').classList.add('hidden');
            } else {
                renderTempSales168Items();
            }
        }

        function saveSales168() {
            if (tempSales168Items.length === 0) return;

            const invoice = {
                id: Date.now(),
                date: new Date().toISOString(),
                items: [...tempSales168Items]
            };

            salesInvoices168.push(invoice);
            localStorage.setItem('salesInvoices168', JSON.stringify(salesInvoices168));

            // بروزرسانی موجودی محصولات
            tempSales168Items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    product.sales168 += item.quantity;
                }
            });

            localStorage.setItem('products', JSON.stringify(products));
            
            // backup خودکار
            autoBackup();

            tempSales168Items = [];
            document.getElementById('sales168-temp-list').classList.add('hidden');
            renderSales168Invoices();
            showToast('فاکتور فروش ۱۶۸ ثبت شد');

            // بروزرسانی select
            updateProductSelects();
        }

        function cancelSales168() {
            tempSales168Items = [];
            document.getElementById('sales168-temp-list').classList.add('hidden');
        }

        function renderSales168Invoices() {
            const container = document.getElementById('sales168-invoices');
            if (salesInvoices168.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #666;">هیچ فاکتور فروش ۱۶۸ وجود ندارد</p>';
                return;
            }

            container.innerHTML = salesInvoices168.map((invoice, index) => `
                <div class="invoice-card">
                    <div class="invoice-header">
                        <div>
                            <strong>فاکتور فروش ۱۶۸ #${invoice.id}</strong>
                            ${editingInvoice?.type === 'sales168' && editingInvoice?.index === index ? 
                                `<input type="date" id="edit-invoice-date-${type}-${index}" value="${persianDateToInput(invoice.date)}" style="margin-right: 10px; padding: 5px;">` :
                                `<span class="invoice-date">${formatPersianDate(invoice.date)}</span>`
                            }
                        </div>
                        <div class="invoice-actions">
                            ${editingInvoice?.type === 'sales168' && editingInvoice?.index === index ? 
                                `<button class="btn btn-success" onclick="saveInvoiceEdit()">💾 ذخیره</button>
                                 <button class="btn btn-secondary" onclick="cancelInvoiceEdit()">❌ لغو</button>
                                 <button class="btn btn-info" onclick="addItemToInvoice('sales168', ${index})">➕ افزودن محصول</button>` :
                                `<button class="btn btn-secondary" onclick="editInvoice(\'sales168\', ${index})">✏️ ویرایش</button>
                                 <button class="btn btn-danger" onclick="deleteInvoice('sales168', ${index})">🗑️ حذف فاکتور</button>`
                            }
                        </div>
                    </div>
                    <div class="invoice-items" id="sales168-invoice-${index}">
                        ${renderInvoiceItems(invoice.items, 'sales168', index)}
                    </div>
                </div>
            `).join('');
        }

        // مدیریت محصولات جدید
        function showAddProduct() {
            document.getElementById('add-product-form').classList.remove('hidden');
        }

        function hideAddProduct() {
            document.getElementById('add-product-form').classList.add('hidden');
            document.getElementById('new-product-name').value = '';
            document.getElementById('new-product-color').value = '';
        }

        function saveNewProduct() {
            const name = document.getElementById('new-product-name').value.trim();
            const color = document.getElementById('new-product-color').value.trim();

            if (!name || !color) {
                showToast('لطفاً نام و رنگ محصول را وارد کنید', 'error');
                return;
            }

            // بررسی تکراری نبودن
            if (products.some(p => p.name === name && p.color === color)) {
                showToast('این محصول قبلاً اضافه شده است', 'error');
                return;
            }

            const newProduct = {
                id: Date.now(),
                name: name,
                color: color,
                entry: 0,
                sales151: 0,
                sales168: 0
            };

            products.push(newProduct);
            localStorage.setItem('products', JSON.stringify(products));
            
            // backup خودکار
            autoBackup();

            hideAddProduct();
            showToast('محصول جدید اضافه شد');
            refreshInventory();
            updateProductSelects();
        }

        // مدیریت موجودی
        function refreshInventory() {
            const tbody = document.getElementById('inventory-body');
            if (products.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">هیچ محصولی وجود ندارد</td></tr>';
                document.getElementById('total-products').textContent = '0';
                document.getElementById('total-stock').textContent = '0';
                document.getElementById('low-stock').textContent = '0';
                return;
            }

            let totalStock = 0;
            let lowStockCount = 0;

            tbody.innerHTML = products.map(product => {
                const stock = getStock(product);
                totalStock += stock;
                if (stock <= 5) lowStockCount++;

                const stockClass = stock <= 5 ? 'stock-low' : 'stock-ok';

                return `
                    <tr>
                        <td>${product.name}</td>
                        <td>${product.color}</td>
                        <td>${product.entry}</td>
                        <td>${product.sales151}</td>
                        <td>${product.sales168}</td>
                        <td class="${stockClass}">${stock}</td>
                    </tr>
                `;
            }).join('');

            // بروزرسانی آمار
            document.getElementById('total-products').textContent = products.length;
            document.getElementById('total-stock').textContent = totalStock;
            document.getElementById('low-stock').textContent = lowStockCount;
        }

        // بارگذاری اولیه
        function init() {
            // بارگذاری تنظیمات cloud sync
            const savedConfig = localStorage.getItem('elishoes_cloud_sync');
            if (savedConfig) {
                try {
                    cloudSync = { ...cloudSync, ...JSON.parse(savedConfig) };
                } catch (e) {
                    console.error('خطا در بارگذاری تنظیمات sync:', e);
                }
            }
            
            // بارگذاری تنظیمات auto backup
            const savedBackup = localStorage.getItem('elishoes_autobackup');
            if (savedBackup) {
                try {
                    autoBackupConfig = { ...autoBackupConfig, ...JSON.parse(savedBackup) };
                } catch (e) {
                    console.error('خطا در بارگذاری تنظیمات backup:', e);
                }
            }
            
            // شروع backup خودکار اگر فعال باشد
            if (autoBackupConfig.enabled) {
                setInterval(() => {
                    if (autoBackupConfig.enabled) {
                        createBackup();
                    }
                }, autoBackupConfig.interval);
            }
            
            renderEntryInvoices();
            renderSales151Invoices();
            renderSales168Invoices();
            updateProductSelects();
            updateEntryProductSelect();
            setDefaultInvoiceDate();  // تنظیم تاریخ پیش‌فرض
            refreshInventory();
            updateSystemInfo();
            updateSyncStatus();
        }

        // شروع برنامه
        init();
