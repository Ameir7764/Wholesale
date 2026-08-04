import React from "react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] p-4 font-sans text-slate-100" lang="ar" dir="rtl">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-lg font-semibold text-slate-300 animate-pulse">
          جارٍ تحميل البيانات...
        </p>
      </div>
    </div>
  );
}
