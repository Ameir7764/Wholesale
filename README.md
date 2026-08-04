# سوق الجملة الذكي (B2B Wholesale-Retail Marketplace)

منصة تجارة إلكترونية متكاملة لربط موزعي وتجار الجملة (Wholesalers) مباشرة مع أصحاب البقالات والتجزئة (Retailers) تحت إشراف لوحة إدارة عامة (Super Admin) لمعالجة الطلبيات والمبيعات والعمليات المالية.

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
   * **تاجر الجملة**: `rawabi@marketplace.com`
   * **صاحب البقالة**: `baqala_noor@marketplace.com`
   * **المدير العام**: `admin@marketplace.com`
   *(يمكنك تسجيل الدخول بالضغط على الروابط الجاهزة بأسفل واجهة الدخول دون إدخال كلمة مرور).*

---

## 🛡️ النقل لسوق العمل والإنتاج (PostgreSQL Production)

المنصة مصممة بأعلى معايير جهوزية التشغيل الفعلي (Production-Ready) وتدعم قواعد بيانات **PostgreSQL**.

### 1. إعداد المتغيرات البيئية
قم بنسخ ملف المتغيرات أو كتابة ملف `.env` في المجلد الرئيسي:
```env
DATABASE_URL="postgresql://db_user:db_password@localhost:5432/wholesale_db?schema=public"
ERP_SECRET_TOKEN="your_secure_erp_token_here"
NODE_ENV="production"
```

### 2. تهيئة وتحديث قاعدة البيانات (Prisma ORM)
بمجرد إضافة `DATABASE_URL` سيتعرف خادم التطبيق تلقائياً على خيار PostgreSQL، قم بتنفيذ الأوامر التالية لرفع الجداول وتوليد الجداول الفعلية:
```bash
# رفع الجداول وتوزيع الفهارس
npx prisma db push

# (اختياري) توليد عميل prisma وتجهيز النظام
npx prisma generate
```

### 3. بناء تطبيق الإنتاج (Production Build)
لبناء المشروع وتدشينه الفعلي على السيرفر (VPS/Vercel/Render):
```bash
npm run build
npm run start
```

---

## 🔌 ربط نظام الـ ERP للموزعين (المزامنة التلقائية)

توفر المنصة واجهة ربط برمجية آمنة وموحدة (API Webhook) متوافقة مع جميع برامج الحسابات الخارجية (مثل: يمن سوفت، الأمين، أودو).

* **الرابط المعتمد للمزامنة**: `POST /api/wholesaler/sync-inventory`
* **مثال على جسم الطلب (JSON Request Body)**:
```json
{
  "storeId": "معرف-متجر-التاجر-من-لوحة-التحكم",
  "secretToken": "رمز_التحقق_المعين_في_ملف_env",
  "products": [
    {
      "sku": "RAW-TUN-01",
      "stock": 140,
      "price": 24200.0
    },
    {
      "sku": "RAW-FAS-02",
      "stock": 60
    }
  ]
}
```

---

## 📂 الهيكل المعماري البرمجي

* `/src/app/actions.ts`: خادم الإجراءات (Server Actions) لمعالجة منطق الشراء وتحديث حالات الطلبات.
* `/src/lib/db.ts`: نظام محاذاة قواعد البيانات الهجين (Prisma + JSON Fallback).
* `/src/lib/crypto.ts`: خوارزمية تشفير وتدقيق كلمات المرور (pbkdf2/scrypt).
* `/src/components/Icons.tsx`: مراجع الرسوم المتجهية (SVG) عالية الأداء للواجهات دون حزم ثقيلة.
* `/src/styles/variables.css`: رموز التصميم الموحدة (Design Tokens)، الحركات والألوان المتناغمة.
