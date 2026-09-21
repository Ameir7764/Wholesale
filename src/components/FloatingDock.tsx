"use client";

import React, { useState, useEffect } from "react";
import { ThemeToggle } from "./ThemeToggle";

export function FloatingDock() {
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowTopBtn(true);
      } else {
        setShowTopBtn(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 p-2 rounded-2xl glass-dock animate-slide-up border border-slate-700/80 shadow-2xl backdrop-blur-2xl dir-rtl">
      
      {/* Theme Switcher Toggle */}
      <ThemeToggle />

      {/* Quick WhatsApp / Support Contact */}
      <a
        href="https://wa.me/?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%A7%D9%84%D8%AA%D9%88%D8%A7%D8%B5%D9%84%20%D9%85%D8%B9%20%D8%AF%D8%B9%D9%85%20%D8%B3%D9%88%D9%82%20%D8%A7%D9%84%D8%AC%D9%85%D9%84%D8%A9%20%D8%A7%D9%84%D8%B0%D9%83%D9%8A"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all hover:scale-105 cursor-pointer"
        title="الدعم الفني المباشر عبر الواتساب"
      >
        <span>💬 الدعم الفني</span>
      </a>

      {/* Back to Top Button */}
      {showTopBtn && (
        <button
          type="button"
          onClick={scrollToTop}
          className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all hover:scale-110 cursor-pointer"
          title="الصعود لأعلى الصفحة"
        >
          ▲ Top
        </button>
      )}

    </div>
  );
}
