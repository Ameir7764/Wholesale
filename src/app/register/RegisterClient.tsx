"use client";

import React, { useState } from "react";
import { registerUser } from "../actions";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";
import { Store, User, ArrowUpRight, Eye, EyeOff } from "@/components/Icons";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function RegisterClient() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "RETAILER" as "WHOLESALER" | "RETAILER",
    storeName: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      showToast("كلمة المرور غير متطابقة", "error");
      return;
    }
    
    if (formData.password.length < 6) {
      showToast("يجب أن تتكون كلمة المرور من 6 أحرف على الأقل", "error");
      return;
    }

    try {
      setLoading(true);
      await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        storeName: formData.role === "WHOLESALER" ? formData.storeName : undefined,
      });
      showToast("تم إنشاء الحساب بنجاح! جاري التوجيه لتسجيل الدخول...", "success");
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error: any) {
      showToast(error.message || "حدث خطأ أثناء التسجيل", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#070a12] p-4 md:p-8 font-sans text-slate-100 overflow-hidden selection:bg-amber-500 selection:text-slate-950" lang="ar" dir="rtl">
      
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-glow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-glow"></div>

      <div className="w-full max-w-xl glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-slate-800/80 z-10 my-auto">
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-emerald-500 via-amber-500 to-blue-500"></div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white mb-1">إنشاء حساب جديد</h2>
            <p className="text-xs text-slate-400">انضم إلى شبكة "سوق الجملة الذكي" وتواصل مع الآلاف مباشرة</p>
          </div>
          <ThemeToggle />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Role Selection Cards */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 text-right">
              اختر نوع الحساب التجاري
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "RETAILER" })}
                className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                  formData.role === "RETAILER"
                    ? "bg-emerald-500/15 border-emerald-500/60 text-emerald-400 shadow-lg shadow-emerald-500/10"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl ${formData.role === "RETAILER" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>
                    <User className="w-5 h-5" />
                  </div>
                  {formData.role === "RETAILER" && <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">صاحب بقالة / تجزئة</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">طلب البضائع والمحفظة الرقمية</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "WHOLESALER" })}
                className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                  formData.role === "WHOLESALER"
                    ? "bg-blue-500/15 border-blue-500/60 text-blue-400 shadow-lg shadow-blue-500/10"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl ${formData.role === "WHOLESALER" ? "bg-blue-500/20 text-blue-400" : "bg-slate-800 text-slate-400"}`}>
                    <Store className="w-5 h-5" />
                  </div>
                  {formData.role === "WHOLESALER" && <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">موزع / تاجر جملة</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">عرض المنتجات وتلقي الطلبات</p>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-right">
              الاسم بالكامل / مسؤول الحساب
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="مثال: أحمد محمد علي"
              value={formData.name}
              onChange={handleChange}
              className="w-full glass-input rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-right">
              البريد الإلكتروني
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full glass-input rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all text-left"
            />
          </div>

          {formData.role === "WHOLESALER" && (
            <div className="animate-slide-down">
              <label className="block text-xs font-semibold text-blue-400 mb-1.5 text-right">
                اسم التجارة / المتجر
              </label>
              <input
                name="storeName"
                type="text"
                required={formData.role === "WHOLESALER"}
                placeholder="مثال: شركة الروابي للمواد الغذائية"
                value={formData.storeName}
                onChange={handleChange}
                className="w-full glass-input rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 border-blue-500/30 focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-right">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPass ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full glass-input rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all text-left pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-right">
                تأكيد كلمة المرور
              </label>
              <input
                name="confirmPassword"
                type={showPass ? "text" : "password"}
                required
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full glass-input rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all text-left"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3.5 px-4 btn-amber rounded-xl text-slate-950 font-bold text-sm transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب والتسجيل"}</span>
            {!loading && <ArrowUpRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-5 text-center text-xs">
          <span className="text-slate-400">لديك حساب بالفعل؟ </span>
          <a href="/" className="font-bold text-amber-400 hover:text-amber-300 underline underline-offset-4 transition-colors">
            سجل دخولك هنا
          </a>
        </div>
      </div>
    </div>
  );
}
