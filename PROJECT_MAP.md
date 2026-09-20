# خريطة المشروع الهيكلية (Wholesale Stores B2B)

هذه الخريطة توضح الهيكل النهائي الكامل لمشروع منصة سوق الجملة الذكي.

```text
Wholesale_Stores/
├── prisma/
│   ├── schema.prisma              # مخطط قاعدة البيانات (PostgreSQL Models: User, Store, Product, Category, Order, OrderItem, Transaction)
│   └── mock_db.json               # قاعدة البيانات التجريبية الهجينة المحلية (JSON Fallback)
├── public/
│   ├── manifest.json              # إعدادات تطبيق الجوال الـ PWA كاملة (Icons, Screenshots, Shortcuts, Scope, Display)
│   ├── sw.js                      # الخدمة في الخلفية (Service Worker) للتصفح والدعم أوفلاين
│   ├── icon-192.png               # أيقونة تطبيق الجوال (192x192 PNG Maskable)
│   ├── icon-512.png               # أيقونة تطبيق الجوال (512x512 PNG Maskable)
│   └── favicon.ico                # أيقونة المتصفح
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── dashboard/         # لوحة تحكم المشرف العام (إدارة المتاجر، الإيداعات، المستخدمين)
│   │   ├── wholesaler/
│   │   │   └── dashboard/         # لوحة تحكم تاجر الجملة (المنتجات، المخزون، الطلبات، مزامنة ERP)
│   │   ├── retailer/
│   │   │   └── marketplace/       # سوق البقالات والتجزئة (التصفح، السلة، المحفظة، الطلب)
│   │   ├── register/              # صفحة تسجيل حساب جديد (تاجر جملة / صاحب بقالة)
│   │   ├── api/
│   │   │   ├── admin/approve-deposit/ # واجهة تأكيد الإيداعات المالية
│   │   │   └── wholesaler/sync-inventory/ # واجهة مزامنة المخزون مع برامج الـ ERP
│   │   ├── actions.ts             # Server Actions (المصادقة، الشراء، التسجيل، التعديلات)
│   │   ├── error.tsx              # صفحة الأخطاء العامة
│   │   ├── loading.tsx            # صفحة التحميل العامة
│   │   ├── not-found.tsx          # صفحة 404 المخصصة
│   │   ├── layout.tsx             # الهيكل الرئيسي والتنبيهات
│   │   └── page.tsx               # صفحة تسجيل الدخول الرئيسية
│   ├── components/
│   │   ├── Icons.tsx              # جميع أيقونات الـ SVG عالية الأداء
│   │   ├── PasswordInput.tsx      # حقل كلمة المرور مع زر إظهار/إخفاء النص
│   │   ├── ServiceWorkerRegister.tsx # مسجل الـ Service Worker التلقائي
│   │   └── Toast.tsx              # نظام التنبيهات العائمة المنبثقة المخصص
│   ├── lib/
│   │   ├── auth.ts                # نظام إدارة الجلسات والمصادقة وتوقيع الـ Cookies بـ HMAC SHA-256
│   │   ├── crypto.ts              # خوارزميات التشفير بـ scrypt
│   │   └── db.ts                  # محرك قاعدة البيانات الهجين (Prisma + JSON Fallback)
│   └── styles/
│       ├── globals.css            # أنماط Tailwind وحركات التنبيهات والتصفح
│       └── variables.css          # رموز وقيم التصميم الموحدة
├── src/middleware.ts              # حماية المسارات على مستوى Next.js
├── .babelrc                       # إعدادات Babel لتجاوز مشاكل SWC الناتجة عن نظام Windows
├── .env                           # المتغيرات البيئية المحلية
├── .env.example                   # نموذج المتغيرات البيئية
├── next.config.ts                 # إعدادات Next.js
├── tailwind.config.js             # إعدادات Tailwind CSS v3
├── package.json                   # الحزم والسكربتات
└── README.md                      # التوثيق الشامل ودليل التشغيل والنشر
```
