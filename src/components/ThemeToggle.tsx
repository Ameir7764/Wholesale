"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Check } from "@/components/Icons";

export type ThemeMode = "obsidian" | "emerald" | "sapphire" | "amethyst";

interface ThemeOption {
  id: ThemeMode;
  name: string;
  badgeColor: string;
  accentGradient: string;
  icon: string;
}

const themeOptions: ThemeOption[] = [
  {
    id: "obsidian",
    name: "ذهبي أوبسيديان",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    accentGradient: "from-amber-500 to-amber-600",
    icon: "🥇",
  },
  {
    id: "emerald",
    name: "زمردي ملكي",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    accentGradient: "from-emerald-500 to-emerald-600",
    icon: "👑",
  },
  {
    id: "sapphire",
    name: "ياقوتي أزرق",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    accentGradient: "from-blue-500 to-blue-600",
    icon: "💎",
  },
  {
    id: "amethyst",
    name: "أرجواني ملكي",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    accentGradient: "from-purple-500 to-purple-600",
    icon: "🔮",
  },
];

export function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>("obsidian");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("wholesale_b2b_theme") as ThemeMode | null;
    if (saved && ["obsidian", "emerald", "sapphire", "amethyst"].includes(saved)) {
      setCurrentTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      document.documentElement.setAttribute("data-theme", "obsidian");
    }
  }, []);

  const changeTheme = (themeId: ThemeMode) => {
    setCurrentTheme(themeId);
    document.documentElement.setAttribute("data-theme", themeId);
    localStorage.setItem("wholesale_b2b_theme", themeId);
    setIsOpen(false);
  };

  const activeOption = themeOptions.find((t) => t.id === currentTheme) || themeOptions[0];

  return (
    <div className="relative inline-block text-right">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel hover:border-amber-500/40 text-xs font-bold transition-all shadow-lg cursor-pointer"
        title="تغيير الثيم والهوية البصرية"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span>{activeOption.icon} {activeOption.name}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute left-0 sm:left-auto right-0 mt-2 w-48 glass-panel p-2 rounded-2xl shadow-2xl border border-slate-800 z-50 animate-slide-down space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 mb-1">
              اختر الهوية البصرية الزجاجية:
            </div>
            {themeOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => changeTheme(opt.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentTheme === opt.id
                    ? `${opt.badgeColor} border shadow-sm`
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{opt.icon}</span>
                  <span>{opt.name}</span>
                </span>
                {currentTheme === opt.id && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
