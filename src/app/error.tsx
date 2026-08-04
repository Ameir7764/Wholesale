"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle } from "@/components/Icons";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4 font-sans text-slate-100" lang="ar" dir="rtl">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-slate-950/60 border border-slate-800/80 p-8 rounded-2xl shadow-2xl backdrop-blur-md relative overflow-hidden z-10 text-center flex flex-col items-center">
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-red-500 via-red-600 to-amber-500"></div>
        
        <AlertCircle className="w-20 h-20 text-red-500 mb-6 opacity-80" />
        
        <h2 className="text-2xl font-bold text-slate-200 mb-2">حدث خطأ غير متوقع</h2>
        <p className="text-slate-400 mb-8 leading-relaxed">
          نعتذر، حدث خطأ أثناء محاولة تحميل هذه الصفحة. يرجى المحاولة مرة أخرى.
        </p>

        <div className="flex flex-col w-full gap-3">
          <button
            onClick={() => reset()}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg transition-all shadow-lg shadow-amber-500/10"
          >
            إعادة المحاولة
          </button>
          
          <Link
            href="/"
            className="w-full py-3.5 px-4 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold rounded-lg transition-all"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
