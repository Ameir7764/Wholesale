import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { authenticateUser } from "./actions";
import "@/styles/variables.css";
import { PasswordInput } from "@/components/PasswordInput";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Shield, Truck, Wallet, Building, ArrowUpRight, CheckCircle, Store, Users, ShoppingBag } from "@/components/Icons";

export default async function LoginPage() {
  const session = await getCurrentUser();

  // If already logged in, redirect to correct workspace
  if (session) {
    if (session.role === "ADMIN") redirect("/admin/dashboard");
    if (session.role === "WHOLESALER") redirect("/wholesaler/dashboard");
    if (session.role === "RETAILER") redirect("/retailer/marketplace");
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#070a12] p-4 md:p-8 font-sans text-slate-100 overflow-hidden selection:bg-amber-500 selection:text-slate-950" dir="rtl" lang="ar">
      
      {/* Dynamic Background Ambient Light Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-glow"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none animate-pulse-glow"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[160px] pointer-events-none"></div>

      <div className="w-full max-w-6xl grid lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10 my-auto">
        
        {/* Left Side: Brand Showcase & Features */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-6 text-right">
          
          {/* Platform Status Badge & Theme Toggle */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="inline-flex items-center space-x-2 space-x-reverse bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-full backdrop-blur-md">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-xs font-bold text-amber-400">سوق الجملة الذكي — منصة B2B المعتمدة</span>
            </div>
            <ThemeToggle />
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-white">
            ربط تجار الجملة <br />
            <span className="gradient-text-amber">بأصحاب البقالات مباشرة</span>
          </h1>
          
          <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-xl font-normal">
            المنصة التجارية المتكاملة لإدارة مبيعات الجملة وتجهيز طلبات التجزئة، مع دعم المحفظة الرقمية والمزامنة التلقائية مع برامج الـ ERP.
          </p>

          {/* Feature Highlight Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="glass-card p-4 rounded-2xl flex items-start space-x-3 space-x-reverse">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">طلب مرن وسريع</h3>
                <p className="text-xs text-slate-400 mt-0.5">حد أدنى ميسر ووحدات تغليف كرتون/شدة.</p>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl flex items-start space-x-3 space-x-reverse">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">محفظة رقمية</h3>
                <p className="text-xs text-slate-400 mt-0.5">شحن وحسابات مالية موثقة وآمنة 100%.</p>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl flex items-start space-x-3 space-x-reverse">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">تتبع المبيعات</h3>
                <p className="text-xs text-slate-400 mt-0.5">تتبع حالات الطلب خطوة بخطوة للعميل.</p>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl flex items-start space-x-3 space-x-reverse">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">ربط الـ ERP</h3>
                <p className="text-xs text-slate-400 mt-0.5">مزامنة المخزون التلقائية مع يمن سوفت وأودو.</p>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-6 pt-4 text-xs text-slate-400 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>متاجر وجملة معتمدة</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-amber-400" />
              <span>تشفير جلسات HMAC</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-400" />
              <span>دعم PWA & APK للجوال</span>
            </div>
          </div>

        </div>

        {/* Right Side: Authentication Box */}
        <div className="lg:col-span-6">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-slate-800/80">
            
            {/* Top Accent Gradient Bar */}
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500"></div>

            <div className="mb-6 text-right">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-2xl font-bold tracking-tight text-white">تسجيل الدخول للمنصة</h2>
                <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">B2B Portal</span>
              </div>
              <p className="text-xs text-slate-400">ادخل بيانات حسابك المسجل للوصول إلى لوحة التحكم</p>
            </div>

            <form action={async (formData: FormData) => {
              "use server";
              const email = formData.get("email") as string;
              const password = formData.get("password") as string;
              await authenticateUser(email, password);
            }} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-1.5 text-right">
                  البريد الإلكتروني للحساب
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full glass-input rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all text-left"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-300 mb-1.5 text-right">
                  كلمة المرور
                </label>
                <PasswordInput />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 btn-amber rounded-xl text-slate-950 font-bold text-sm transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>دخول المنصة التجارية</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-5 text-center text-xs">
              <span className="text-slate-400">ليس لديك حساب تجاري حتى الآن؟ </span>
              <a href="/register" className="font-bold text-amber-400 hover:text-amber-300 underline underline-offset-4 transition-colors">
                إنشاء حساب جديد
              </a>
            </div>

            {/* Collapsible Quick Demo Helpers — Only in Development */}
            {process.env.NODE_ENV !== "production" && (
            <details className="mt-6 pt-5 border-t border-slate-800/80 group">
              <summary className="text-xs font-medium text-slate-400 hover:text-slate-200 cursor-pointer flex items-center justify-between transition-colors select-none">
                <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                  <span>💡 حسابات تجريبية سريعة للمعاينة (اضغط للتعبئة والدخول)</span>
                </span>
                <span className="text-slate-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              
              <div className="mt-4 space-y-2.5 animate-fade-in">
                {/* Demo Wholesaler */}
                <form action={async () => {
                  "use server";
                  await authenticateUser("rawabi@marketplace.com", process.env.DEMO_WHOLESALER_PASSWORD || "");
                }}>
                  <button
                    type="submit"
                    className="w-full text-right bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-blue-500/40 p-3 rounded-xl flex justify-between items-center transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-400">تاجر الجملة (شركة الروابي)</p>
                        <p className="text-[11px] text-slate-400">إدارة المنتجات، قبول الطلبات، المبيعات</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-lg border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-slate-950 transition-colors">
                      دخول مباشر
                    </span>
                  </button>
                </form>

                {/* Demo Retailer */}
                <form action={async () => {
                  "use server";
                  await authenticateUser("baqala_noor@marketplace.com", process.env.DEMO_RETAILER_PASSWORD || "");
                }}>
                  <button
                    type="submit"
                    className="w-full text-right bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-emerald-500/40 p-3 rounded-xl flex justify-between items-center transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-400">صاحب بقالة (بقالة النور)</p>
                        <p className="text-[11px] text-slate-400">تصفح المنتجات، سلة الشراء، المحفظة</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                      دخول مباشر
                    </span>
                  </button>
                </form>

                {/* Demo Admin */}
                <form action={async () => {
                  "use server";
                  await authenticateUser("admin@marketplace.com", process.env.DEMO_ADMIN_PASSWORD || "");
                }}>
                  <button
                    type="submit"
                    className="w-full text-right bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/40 p-3 rounded-xl flex justify-between items-center transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-amber-400">مدير النظام (Super Admin)</p>
                        <p className="text-[11px] text-slate-400">اعتماد المتاجر، شحن المحافظ، الإحصائيات</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-lg border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                      دخول مباشر
                    </span>
                  </button>
                </form>
              </div>
            </details>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
