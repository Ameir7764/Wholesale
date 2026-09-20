# سوق الجملة الذكي (B2B Wholesale-Retail Marketplace)

منصة تجارة إلكترونية متكاملة لربط موزعي وتجار الجملة (Wholesalers) مباشرة مع أصحاب البقالات والتجزئة (Retailers) تحت إشراف لوحة إدارة عامة (Super Admin) لمعالجة الطلبيات والمبيعات والعمليات المالية، مع دعم كامل لتحويل المنصة إلى تطبيق جوال (PWA / APK).

---

## 🌟 أبرز الميزات المكتملة

- 🛡️ **نظام أمان عالي**: كلمات مرور مشفرة بـ `scrypt` مع Salt عشوائي، جلسات موقعة رقمياً بـ `HMAC SHA-256` عبر `SESSION_SECRET` لمنع الانتحال، وحماية مسارات بالـ `Middleware`.
- 📱 **تطبيق جوال جاهز (PWA & APK)**: تدعم المنصة التثبيت الفوري كـ Progressive Web App مع دعم الخدمة في الخلفية (`sw.js`) وأيقونات عالية الدقة وقابلة للتحويل إلى ملف `APK` على أندرويد عبر PWABuilder.
- 🎨 **تصميم عصري ومتجاوب**: تجربة مستخدم سوداء وفخمة (Dark Theme) متوافقة 100% مع الجوال والشاشات المختلفة مع خيارات تمرير سلسة للأشرطة وتنبيهات مخصصة (`Toast`).
- 👤 **تسجيل حسابات جديدة**: صفحة `/register` تتيح للتجار والبقالات تسجيل حسابات جديدة مع إنشاء سجل متجر تلقائي للتجار واعتماد المشرف.
- 🔌 **ربط أنظمة الـ ERP**: واجهة برمجية آمنة (`/api/wholesaler/sync-inventory`) لمزامنة المخزون والأسعار مع البرامج المحاسبية الخارجية.

---

## 🚀 دليل بدء التشغيل السريع (Local Development)

النظام مهيأ للعمل **مباشرة بدون أي إعداد خارجي** عبر محرك قاعدة بيانات هجين محلي (JSON-based) للتبسيط.

1. **تثبيت الحزم اللازمة**:
   ```bash
   npm install
   ```

2. **تشغيل الخادم المحلي**:
   ```bash
   npm run dev
   ```
   افتح الرابط: [http://localhost:3000](http://localhost:3000) لتجربة المنصة.

3. **بيانات الدخول التجريبية (Demo Accounts)**:
   * **تاجر الجملة**: `rawabi@marketplace.com` | كلمة المرور: `wholesaler123`
   * **صاحب البقالة**: `baqala_noor@marketplace.com` | كلمة المرور: `retailer123`
   * **المدير العام**: `admin@marketplace.com` | كلمة المرور: `adminpassword123`

---

## 🛡️ النقل لسوق العمل والإنتاج (PostgreSQL & Vercel)

المنصة مصممة بأعلى معايير جهوزية التشغيل الفعلي (Production-Ready) وتدعم قواعد بيانات **PostgreSQL**.

### 1. إعداد المتغيرات البيئية
قم بنسخ ملف المتغيرات أو كتابة ملف `.env` في المجلد الرئيسي:
```env
DATABASE_URL="postgresql://db_user:db_password@localhost:5432/wholesale_db?schema=public"
SESSION_SECRET="b2b-wholesale-marketplace-secret-key-2024-production"
ERP_SECRET_TOKEN="your_secure_erp_token_here"
NODE_ENV="production"
```

### 2. تهيئة وتحديث قاعدة البيانات (Prisma ORM)
بمجرد إضافة `DATABASE_URL` سيتعرف خادم التطبيق تلقائياً على خيار PostgreSQL:
```bash
# رفع الجداول وتوزيع الفهارس
npx prisma db push

# توليد عميل prisma وتجهيز النظام
npx prisma generate
```

### 3. بناء تطبيق الإنتاج (Production Build)
```bash
npm run build
npm run start
```

---

## 📲 تحويل المنصة إلى تطبيق جوال (APK / PWA)

1. **التثبيت المباشر على الجوال (PWA)**:
   افتح موقعك المرفوع من متصفح الجوال واضغط على **"تثبيت التطبيق / Install App"** لتنزيل التطبيق فوراً على شاشة الجوال الرئيسية.

2. **إنشاء ملف APK قابل للإرسال**:
   ادخل على [PWABuilder.com](https://www.pwabuilder.com/)، ضع رابط موقعك المرفوع على Vercel، واضغط على **Package For Stores** -> **Generate Android APK** لتحميل ملف `app-release.apk`.

---

## 📂 الهيكل المعماري البرمجي

* `/src/middleware.ts`: حماية المسارات والتحقق من أدوار المستخدمين والجلسات الموقعة.
* `/src/app/actions.ts`: خادم الإجراءات (Server Actions) لإجراءات الشراء، تسجيل الحسابات وتحديث الطلبات.
* `/src/lib/auth.ts`: إدارة الجلسات والمصادقة وتوقيع الـ Cookies بـ HMAC.
* `/src/lib/crypto.ts`: تشفير وتدقيق كلمات المرور بـ scrypt.
* `/src/lib/db.ts`: محرك قواعد البيانات الهجين (Prisma + JSON Fallback).
* `/src/components/Toast.tsx`: نظام التنبيهات المنبثقة المخصص.
* `/src/components/Icons.tsx`: أيقونات SVG عالية الأداء.
* `/public/manifest.json` & `/public/sw.js`: ملفات دعم وتثبيت تطبيق الجوال الـ PWA.
