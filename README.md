# سوق الجملة الذكي | Smart B2B Wholesale-Retail Marketplace

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js 16](https://img.shields.io/badge/Next.js%2016-black?style=for-the-badge&logo=next.js&logoColor=white)
![React 19](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Prisma ORM](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)

**منصة تجارة إلكترونية متطورة لربط موزعي وتجار الجملة مباشرة مع أصحاب البقالات والتجزئة**  
*Enterprise-Grade B2B Commerce Platform with Real-Time ERP Sync, Digital Wallet & Native PWA*

[الميزات](#-الميزات-الرئيسية) • [الأمان](#-معايير-الأمان-وحماية-البيانات) • [البنية الهيكلية](#-البنية-المعمارية) • [التشغيل السريع](#-دليل-التشغيل-السريع) • [النشر للإنتاج](#-إعدادات-الإنتاج)

</div>

---

## 📖 نبذة عن المشروع (Overview)

منصة **سوق الجملة الذكي** صُممت لمعالجة التحديات التشغيلية واللوجستية في سلسلة توريد التجزئة وسوق الجملة:
- تتيح **لتجار الجملة وموردي الأغذية** إدارة كتالوجاتهم، تسعير الجملة بالكرتون والشدة، وتلقي الطلبات فورياً.
- تمنح **أصحاب البقالات ومتاجر التجزئة** تجربة تسوق سلسة مع معرفة الحد الأدنى للطلب (MOQ)، وتتبع مسار الشحنات، والدفع المباشر عبر المحفظة الرقمية أو الحساب البنكي.
- توفر **لوحة تحكم للمشرف العام (Super Admin)** للرقابة، اعتماد الحسابات والمتاجر الجديدة، وتسوية المعاملات المالية بدقة متناهية.

---

## ✨ الميزات الرئيسية (Core Features)

### 🏢 لوحات التحكم المخصصة (Multi-Tenant Dashboards)
- **لوحة تاجر الجملة (Wholesaler Portal):** إدارة قوائم المنتجات، تعديل الأسعار، متابعة فواتير الطلبات، ومزامنة المخزون مع البرامج المحاسبية.
- **سوق البقالات والتجزئة (Retailer Marketplace):** استعراض العروض، البحث المتقدم، سلة تسوق ذكية بوحدات الجملة، شحن المحفظة ومتابعة الفواتير.
- **لوحة المشرف العام (Super Admin):** تدقيق المستندات والمتاجر، إدارة المستخدمين، مراجعة العمليات المالية وتأكيد الإيداعات.

### 💳 المحفظة الرقمية والمدفوعات (Fintech & Wallet System)
- نظام محفظة رقمية مدمجة يدعم الإيداع عبر التحويل البنكي أو المحافظ الإلكترونية.
- تسجيل حركات الحساب بدقة (Audit Log / Transactions) مع أرقام مرجعية موثقة.
- تأكيد وإلغاء العمليات المالية بنقرة واحدة من لوحة الإدارة.

### 📱 تطبيق ويب تقدمي متكامل (PWA & Mobile Ready)
- دعم كامل للتشغيل كـ Progressive Web App مع Service Worker وتخزين مؤقت.
- شاشات وتصاميم متجاوبة 100% مع كافة أحجام الشاشات الذكية (Responsive Design).
- إمكانية التصدير السريع كملف `APK` لنظام Android.

### 🔄 تكامل أنظمة الـ ERP (Enterprise Integration)
- واجهة برمجية آمنة ومحمية بتوكن للمزامنة اللحظية مع برامج تخطيط الموارد مثل **يمن سوفت (Onyx Pro)** و **Odoo**.
- معالجة تحديثات الكميات والأسعار آلياً لمنع تعارض المخزون.

---

## 🔒 معايير الأمان وحماية البيانات (Security Architecture)

صُممت المنصة باتباع أفضل الممارسات الدولية في هندسة الأمان البرمجي:

1. **تشفير كلمات المرور (Cryptographic Password Hashing):**
   - استخدام خوارزمية `scrypt` المقاومة لهجمات القوة الغاشمة (Brute-force) مع توليد Salt عشوائي فريد لكل مستخدم.
   - التحقق من كلمات المرور عبر المقارنة ذات الوقت الثابت (`timingSafeEqual`) لمنع هجمات التوقيت (Timing Attacks).

2. **توقيع الجلسات الرقمي (HMAC-SHA256 Signed Sessions):**
   - حماية ملفات تعريف الارتباط (`Cookies`) بتوقيع رقمي تشفيري عبر مفتاح بيئي عشوائي.
   - منع انتحال الهوية أو تزوير صلاحيات المستخدم (Session Tampering Protection).
   - إعدادات أمان مشددة: `httpOnly`, `sameSite: strict`, `secure`.

3. **التحكم بالوصول القائم على الأدوار (RBAC via Middleware):**
   - عزل كامل بين بوابات المشرفين، تجار الجملة، وأصحاب البقالات عبر طبقة `Next.js Middleware`.
   - منع الوصول غير المصرح للمسارات الحساسة وعمليات الخادم (Server Actions).

4. **حماية الأسرار والمتغيرات الحساسة:**
   - عزل جميع المفاتيح والتوكنات وروابط قواعد البيانات خارج شجرة الكود المصدرية عبر ملفات بيئية (`.env`).
   - حماية مسارات الـ Webhook بتوكنات سرية مستقلة.

---

## 🏗️ البنية المعمارية (Architecture & Tech Stack)

| الطبقة | التقنية المستخدمة | الدور في المنصة |
|---|---|---|
| **Frontend Framework** | **Next.js 16 (App Router)** | واجهات حديثة تعتمد على مكونات الخادم والعميل |
| **UI Engine** | **React 19 & Tailwind CSS v3** | تصميم فخم بمؤثرات زجاجية وأنماط داكنة وفاتحة |
| **Language** | **TypeScript 5** | أمان نمطي صارم لتقليل الأخطاء التشغيلية |
| **Database ORM** | **Prisma ORM 6** | نمذجة الجداول والاستعلامات الآمنة مع Type Safety |
| **Database Engine** | **PostgreSQL** / Hybrid In-Memory Fallback | قواعد بيانات علائقية متوافقة مع البيئات السحابية |
| **PWA & Offline** | **Custom Service Worker** | جاهزية التثبيت الفوري بدون إنترنت للجوالات |

---

## 🚀 دليل التشغيل السريع (Local Development)

### 1. المتطلبات الأساسية
- بيئة Node.js (الإصدار 18 أو أحدث)
- مدير الحزم `npm`

### 2. تثبيت الاعتماديات
```bash
npm install
```

### 3. إعداد المتغيرات البيئية
قم بإنشاء ملف `.env` بناءً على النموذج المرفق `.env.example`:
```bash
cp .env.example .env
```
قم بملء المتغيرات الخاصة بك:
```env
SESSION_SECRET="your_secure_random_64_byte_key"
DATABASE_URL="postgresql://user:password@localhost:5432/wholesale_db?schema=public"
```

### 4. تشغيل الخادم المحلي
```bash
npm run dev
```
افتح المتصفح على الرابط: `http://localhost:3000`

---

## 🌐 إعدادات الإنتاج والنشر السحابي (Production & Cloud Deployment)

المنصة جاهزة للنشر الفوري على منصات مثل **Vercel**, **Railway**, **AWS**, أو **Render**:

```bash
# فحص الأنواع وبناء حزمة الإنتاج
npm run build

# تشغيل خادم الإنتاج
npm run start
```

### مزامنة قاعدة البيانات (Prisma):
```bash
# تطبيق التعديلات على قاعدة بيانات الإنتاج
npx prisma db push

# توليد عميل Prisma المحدث
npx prisma generate
```

---

## 📁 الهيكل البرمجي (Directory Structure)

```text
Wholesale_Stores/
├── prisma/
│   ├── schema.prisma              # مخطط الجداول وقواعد البيانات (PostgreSQL)
│   └── seed.ts                    # بيانات التهيئة الأولية الآمنة
├── public/
│   ├── manifest.json              # إعدادات تطبيق الويب التقدمي (PWA)
│   └── sw.js                      # Service Worker للتخزين المؤقت والتشغيل أوفلاين
├── src/
│   ├── app/                       # صفحات وتوجيهات Next.js App Router
│   │   ├── admin/dashboard/       # لوحة تحكم المشرف العام
│   │   ├── wholesaler/dashboard/  # لوحة تحكم تاجر الجملة
│   │   ├── retailer/marketplace/  # بوابة سوق التجزئة والبقالات
│   │   ├── register/              # بوابة تسجيل الحسابات الجديدة
│   │   ├── actions.ts             # خادم العمليات الآمن (Server Actions)
│   │   └── page.tsx               # صفحة تسجيل الدخول الرئيسية
│   ├── components/                # مكونات الواجهة الموحدة
│   ├── lib/
│   │   ├── auth.ts                # إدارة الجلسات والمصادقة وتوقيع HMAC
│   │   ├── crypto.ts              # التشفير والتدقيق بـ scrypt
│   │   └── db.ts                  # محرك قواعد البيانات الهجين
│   └── middleware.ts              # حماية المسارات والتحقق من الصلاحيات
├── .env.example                   # نموذج المتغيرات البيئية الآمن
└── README.md                      # التوثيق الشامل
```

---

<div align="center">

تم تطوير المشروع وفق أعلى معايير الجودة والأمان والأداء المؤسسي.  
Developed with professional software engineering principles, high-performance architecture, and zero-trust security.

</div>
