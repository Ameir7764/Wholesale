"use client";

import React, { useState } from "react";
import { registerUser } from "../actions";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";
import { Store, User } from "@/components/Icons";

export default function RegisterClient() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "RETAILER" as "WHOLESALER" | "RETAILER",
    storeName: "",
  });
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
      showToast("تم التسجيل بنجاح! بانتظار موافقة الإدارة.", "success");
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error: any) {
      showToast(error.message || "حدث خطأ أثناء التسجيل", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4 font-sans text-slate-100 selection:bg-amber-500 selection:text-slate-950" lang="ar" dir="rtl">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-xl bg-slate-950/60 border border-slate-800/80 p-8 rounded-2xl shadow-2xl backdrop-blur-md relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500"></div>

        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-400 bg-clip-text text-transparent">إنشاء حساب جديد</h2>
          <p className="text-sm text-slate-400 mt-2">انضم إلى منصة سوق الجملة الذكي الآن</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "RETAILER" })}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.role === "RETAILER" ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"}`}
            >
              <User className="w-8 h-8" />
              <span className="font-semibold">صاحب بقالة</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "WHOLESALER" })}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.role === "WHOLESALER" ? "bg-blue-500/10 border-blue-500 text-blue-400" : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"}`}
            >
              <Store className="w-8 h-8" />
              <span className="font-semibold">تاجر جملة</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              الاسم بالكامل
            </label>
            <input
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              البريد الإلكتروني
            </label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              dir="ltr"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors text-left"
            />
          </div>

          {formData.role === "WHOLESALER" && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                اسم المتجر
              </label>
              <input
                name="storeName"
                type="text"
                required={formData.role === "WHOLESALER"}
                value={formData.storeName}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                كلمة المرور
              </label>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                dir="ltr"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors text-left"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                تأكيد كلمة المرور
              </label>
              <input
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                dir="ltr"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors text-left"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 text-slate-950 font-bold rounded-lg transition-all shadow-lg shadow-amber-500/10"
          >
            {loading ? "جاري التسجيل..." : "إنشاء حساب"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-slate-400 hover:text-white transition-colors">
            لديك حساب بالفعل؟ سجل دخولك
          </a>
        </div>
      </div>
    </div>
  );
}
