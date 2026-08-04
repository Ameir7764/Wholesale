import React from "react";
import Link from "next/link";
import { AlertTriangle } from "@/components/Icons";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4 font-sans text-slate-100" lang="ar" dir="rtl">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-950/60 border border-slate-800/80 p-8 rounded-2xl shadow-2xl backdrop-blur-md relative overflow-hidden z-10 text-center flex flex-col items-center">
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-amber-400"></div>
        
        <AlertTriangle className="w-20 h-20 text-amber-500 mb-6 opacity-80" />
        
        <h1 className="text-6xl font-black tracking-tight text-white mb-4">404</h1>
        <h2 className="text-2xl font-bold text-slate-200 mb-2">الصفحة غير موجودة</h2>
        <p className="text-slate-400 mb-8 leading-relaxed">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>

        <Link
          href="/"
          className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg transition-all shadow-lg shadow-amber-500/10 inline-block"
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
