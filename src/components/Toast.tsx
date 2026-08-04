"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CheckCircle, AlertTriangle, AlertCircle, X, Info } from "./Icons";

// Since Info is not in Icons.tsx, let's create a small local one or just use AlertCircle. 
// Actually, I'll add an inline Info SVG if needed, or use AlertCircle for info.
const InfoIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onRemove }: { toast: Toast; onRemove: () => void }) => {
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRemoving(true);
    }, 3700); // Start exit animation before actual removal
    return () => clearTimeout(timer);
  }, []);

  const getIcon = () => {
    switch (toast.type) {
      case "success": return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "error": return <AlertCircle className="w-5 h-5 text-red-400" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case "info": return <InfoIcon className="w-5 h-5 text-blue-400" />;
    }
  };

  const getBgStyle = () => {
    switch (toast.type) {
      case "success": return "bg-green-900/40 border-green-500/30";
      case "error": return "bg-red-900/40 border-red-500/30";
      case "warning": return "bg-amber-900/40 border-amber-500/30";
      case "info": return "bg-blue-900/40 border-blue-500/30";
    }
  };

  const getProgressColor = () => {
    switch (toast.type) {
      case "success": return "bg-green-400";
      case "error": return "bg-red-400";
      case "warning": return "bg-amber-400";
      case "info": return "bg-blue-400";
    }
  };

  return (
    <div 
      className={`relative overflow-hidden flex items-center justify-between gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 ${getBgStyle()} ${isRemoving ? "opacity-0 -translate-y-4" : "animate-slide-down"}`}
      dir="rtl"
    >
      <div className="flex items-center gap-3">
        {getIcon()}
        <span className="text-sm font-medium text-white">{toast.message}</span>
      </div>
      <button 
        onClick={() => {
          setIsRemoving(true);
          setTimeout(onRemove, 300);
        }}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <div 
          className={`h-full ${getProgressColor()}`} 
          style={{ 
            animation: "toast-progress 4s linear forwards",
            transformOrigin: "left"
          }} 
        />
      </div>
    </div>
  );
};
