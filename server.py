#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
سرو فایل ساده برای اجرای سیستم انبارداری
این فایل را در همان پوشه فایل‌های HTML اجرا کنید
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

# تنظیمات
PORT = 8080
HOST = "localhost"

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # اضافه کردن headers برای فایل‌های local
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def log_message(self, format, *args):
        # شخصی‌سازی پیام‌های لاگ
        print(f"[{self.log_date_time_string()}] {format % args}")

def main():
    # تغییر به دایرکتوری اسکریپت
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # بررسی وجود فایل‌های ضروری
    if not Path("index.html").exists():
        print("❌ خطا: فایل index.html یافت نشد!")
        print("   لطفاً این اسکریپت را در همان پوشه فایل‌های HTML اجرا کنید.")
        sys.exit(1)
    
    print("🚀 شروع سرو فایل سیستم انبارداری...")
    print(f"📁 دایرکتوری: {script_dir}")
    print(f"🌐 آدرس: http://localhost:{PORT}")
    print("\n" + "="*50)
    
    try:
        with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
            print(f"✅ سرور با موفقیت راه‌اندازی شد!")
            print(f"🔗 لطفاً مرورگر خود را باز کنید و آدرس زیر را وارد کنید:")
            print(f"   http://localhost:{PORT}")
            print(f"\n⏹️  برای توقف سرور، Ctrl+C بزنید")
            print("="*50)
            
            # باز کردن خودکار مرورگر
            try:
                webbrowser.open(f'http://{HOST}:{PORT}')
                print("🌐 مرورگر به صورت خودکار باز شد...")
            except:
                print("💡 لطفاً مرورگر را به صورت دستی باز کنید")
            
            print("\n📱 برای دسترسی از موبایل:")
            print(f"   - آیفون/آیپد: http://YOUR_COMPUTER_IP:{PORT}")
            print(f"   - آندروید: http://YOUR_COMPUTER_IP:{PORT}")
            print("   (YOUR_COMPUTER_IP را با IP کامپیوتر خود جایگزین کنید)\n")
            
            # شروع سرور
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n⏹️  سرور متوقف شد.")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ خطا: پورت {PORT} در حال استفاده است!")
            print("   لطفاً پورت دیگری امتحان کنید یا سرور دیگری را متوقف کنید.")
        else:
            print(f"❌ خطا در راه‌اندازی سرور: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ خطای غیرمنتظره: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()