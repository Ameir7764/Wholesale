"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "./Icons";

export function PasswordInput() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        id="password"
        name="password"
        type={showPassword ? "text" : "password"}
        required
        placeholder="********"
        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors text-left pr-12"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-amber-500 transition-colors"
        aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
      >
        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  );
}
