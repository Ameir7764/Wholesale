import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { authenticateUser } from "./actions";
import "@/styles/variables.css";
import { PasswordInput } from "@/components/PasswordInput";

export default async function LoginPage() {
  const session = await getCurrentUser();

  // If already logged in, redirect to correct workspace
  if (session) {
    if (session.role === "ADMIN") redirect("/admin/dashboard");
    if (session.role === "WHOLESALER") redirect("/wholesaler/dashboard");
    if (session.role === "RETAILER") redirect("/retailer/marketplace");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4 font-sans text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-5xl grid md:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Side: Brand Intro */}
        <div className="md:col-span-6 flex flex-col justify-center space-y-6 text-right" lang="ar" dir="rtl">
          <div className="inline-flex items-center space-x-2 space-x-reverse bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full self-start">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-amber-400">منصة B2B للبيع بالجملة</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight bg-gradient-to-r from-white via-slate-100 to-amber-400 bg-clip-text text-transparent">
            سوق الجملة الذكي
          </h1>
          
          <p className="text-slate-400 text-lg leading-relaxed max-w-md">
            المنصة الإلكترونية الأولى لتوصيل تجار الجملة والموزعين مباشرة بأصحاب البقالات ومحلات التجزئة بأمان تام وسرعة فائقة.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl backdrop-blur-sm">
              <h3 className="font-bold text-amber-400 text-lg">طلب مرن</h3>
              <p className="text-xs text-slate-400 mt-1">تصفح وقارن المنتجات ووحدات التغليف مع حد أدنى ميسر للطلب.</p>
            </div>
            <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl backdrop-blur-sm">
              <h3 className="font-bold text-amber-400 text-lg">لوحة تحكم ذكية</h3>
              <p className="text-xs text-slate-400 mt-1">تابع المبيعات، الطلبات، والفواتير، مع إمكانية الربط مع نظام الـ ERP الخاص بك.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Login Box */}
        <div className="md:col-span-6 bg-slate-950/60 border border-slate-800/80 p-8 rounded-2xl shadow-2xl backdrop-blur-md relative overflow-hidden glow-hover">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500"></div>

          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white">تسجيل الدخول للمنصة</h2>
            <p className="text-sm text-slate-400 mt-1">اختر حساباً تجريبياً أدناه لتصفح المنصة فوراً</p>
          </div>

          <form action={async (formData: FormData) => {
            "use server";
            const email = formData.get("email") as string;
            const password = formData.get("password") as string;
            await authenticateUser(email, password);
          }} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-right">
                البريد الإلكتروني للـحساب
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="example@marketplace.com"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors text-left"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-right">
                كلمة المرور
              </label>
              <PasswordInput />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-amber-500/10 cursor-pointer"
            >
              دخول المنصة
            </button>
          </form>

          <div className="mt-4 text-center">
            <a href="/register" className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
              ليس لديك حساب؟ سجل الآن
            </a>
          </div>

          {/* Quick Demo Access Area */}
          <div className="mt-8 pt-6 border-t border-slate-900" lang="ar" dir="rtl">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 text-center">
              بيانات الدخول التجريبية (اضغط للتعبئة والدخول)
            </h3>
            
            <div className="space-y-3">
              {/* Demo Wholesaler */}
              <form action={async () => {
                "use server";
                await authenticateUser("rawabi@marketplace.com", "wholesaler123");
              }}>
                <button
                  type="submit"
                  className="w-full text-right bg-slate-900/40 hover:bg-slate-900 border border-slate-800/60 hover:border-slate-800 p-3 rounded-lg flex justify-between items-center transition-colors group cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-semibold text-blue-400">تاجر الجملة (شركة الروابي)</p>
                    <p className="text-xs text-slate-500">إدارة المنتجات، قبول الطلبات، رسم بياني للمبيعات</p>
                  </div>
                  <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/10 group-hover:bg-blue-500 group-hover:text-slate-950 transition-colors">
                    دخول
                  </span>
                </button>
              </form>

              {/* Demo Retailer */}
              <form action={async () => {
                "use server";
                await authenticateUser("baqala_noor@marketplace.com", "retailer123");
              }}>
                <button
                  type="submit"
                  className="w-full text-right bg-slate-900/40 hover:bg-slate-900 border border-slate-800/60 hover:border-slate-800 p-3 rounded-lg flex justify-between items-center transition-colors group cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-semibold text-emerald-400">صاحب بقالة (بقالة النور)</p>
                    <p className="text-xs text-slate-500">تصفح البضائع، سلة الشراء، الدفع الإلكتروني، تتبع الطلب</p>
                  </div>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                    دخول
                  </span>
                </button>
              </form>

              {/* Demo Admin */}
              <form action={async () => {
                "use server";
                await authenticateUser("admin@marketplace.com", "adminpassword123");
              }}>
                <button
                  type="submit"
                  className="w-full text-right bg-slate-900/40 hover:bg-slate-900 border border-slate-800/60 hover:border-slate-800 p-3 rounded-lg flex justify-between items-center transition-colors group cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-semibold text-amber-400">مدير النظام (م/امير علي)</p>
                    <p className="text-xs text-slate-500">موافقة على تسجيل المتاجر، مراقبة العمليات والتحليلات</p>
                  </div>
                  <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded border border-amber-500/10 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                    دخول
                  </span>
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
