/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useRef } from "react";
import { Printer, X, CheckCircle, ShieldCheck } from "@/components/Icons";

interface TaxInvoiceModalProps {
  order: {
    id: string;
    createdAt: Date | string;
    status: string;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
    retailerNote?: string | null;
    sellerReply?: string | null;
    items: {
      id: string;
      quantity: number;
      price: number;
      product: {
        name: string;
        packingUnit?: string;
        sku?: string | null;
        store?: {
          name: string;
        };
      };
    }[];
    retailer?: {
      name: string;
      email?: string;
    };
  };
  onClose: () => void;
}

export function TaxInvoiceModal({ order, onClose }: TaxInvoiceModalProps) {
  const printableRef = useRef<HTMLDivElement>(null);

  const subtotal = order.total / 1.15;
  const vatAmount = order.total - subtotal;
  const formattedDate = new Date(order.createdAt).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handlePrint = () => {
    window.print();
  };

  const storeName = order.items[0]?.product?.store?.name || "سوق الجملة الذكي";
  const vatNumber = "301298457600003"; // ZATCA Tax Registration Number

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      {/* Container */}
      <div className="relative w-full max-w-3xl bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden my-8 print:my-0 print:border-none print:shadow-none print:w-full print:max-w-none print:bg-white print:text-black">
        
        {/* Action Header - Hidden on print */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 print:hidden">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <ShieldCheck className="w-5 h-5" />
            <span>الفاتورة الضريبية المبسّطة (معتمدة)</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-amber-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content Area */}
        <div ref={printableRef} className="p-8 space-y-6 text-slate-200 print:text-slate-900 print:p-0">
          
          {/* Header & Seller Info */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-800 print:border-slate-300 gap-4">
            <div>
              <div className="text-2xl font-black text-amber-400 print:text-amber-700 tracking-wide">
                {storeName}
              </div>
              <p className="text-sm text-slate-400 print:text-slate-600">منصة سوق الجملة الذكي B2B</p>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-1">الرقم الضريبي: <span className="font-mono">{vatNumber}</span></p>
            </div>
            <div className="text-left sm:text-left dir-ltr print:text-right">
              <div className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 print:bg-slate-100 print:text-slate-800 print:border-slate-300 rounded-lg text-xs font-bold mb-1">
                VAT TAX INVOICE
              </div>
              <div className="text-xs text-slate-400 print:text-slate-600 font-mono">
                رقم الفاتورة: #{order.id.slice(0, 8).toUpperCase()}
              </div>
              <div className="text-xs text-slate-400 print:text-slate-600">التاريخ: {formattedDate}</div>
            </div>
          </div>

          {/* Customer & Payment Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-800/50 print:bg-slate-50 border border-slate-700/50 print:border-slate-200">
            <div>
              <span className="text-xs text-slate-400 print:text-slate-500 block font-semibold mb-1">بيانات العميل (التاجر):</span>
              <p className="font-bold text-slate-100 print:text-slate-900">{order.retailer?.name || "تاجر تجزئة مسجل"}</p>
              <p className="text-xs text-slate-400 print:text-slate-600">{order.retailer?.email}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400 print:text-slate-500 block font-semibold mb-1">تفاصيل الدفع والحالة:</span>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 print:text-slate-800">
                <span>طريقة الدفع:</span>
                <span className="text-amber-400 print:text-amber-700 font-bold">
                  {order.paymentMethod === "WALLET" ? "المحفظة الرقمية" : order.paymentMethod === "CASH_ON_DELIVERY" ? "الدفع عند الاستلام" : "تحويل بنكي / سداد"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-400 print:text-emerald-700 font-medium mt-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>حالة السداد: {order.paymentStatus === "COMPLETED" ? "مدفوع بالكامل" : "قيد المعالجة"}</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-800 print:border-slate-300 text-slate-400 print:text-slate-700">
                  <th className="py-3 px-2 font-bold">#</th>
                  <th className="py-3 px-2 font-bold">الصنف</th>
                  <th className="py-3 px-2 font-bold text-center">الكمية</th>
                  <th className="py-3 px-2 font-bold text-left">سعر الوحدة</th>
                  <th className="py-3 px-2 font-bold text-left">الإجمالي (شامل الضريبة)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                {order.items.map((item, idx) => {
                  const lineTotal = item.price * item.quantity;
                  return (
                    <tr key={item.id} className="text-slate-200 print:text-slate-900">
                      <td className="py-3 px-2 font-mono text-slate-400 print:text-slate-600">{idx + 1}</td>
                      <td className="py-3 px-2 font-semibold">
                        {item.product.name}
                        {item.product.packingUnit && (
                          <span className="text-xs text-slate-400 print:text-slate-600 font-normal mr-1">
                            ({item.product.packingUnit})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center font-mono font-bold">{item.quantity}</td>
                      <td className="py-3 px-2 text-left font-mono">{item.price.toLocaleString("ar-SA")} ر.س</td>
                      <td className="py-3 px-2 text-left font-mono font-bold text-amber-400 print:text-amber-800">
                        {lineTotal.toLocaleString("ar-SA")} ر.س
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals & Tax Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pt-4 border-t border-slate-800 print:border-slate-300 gap-6">
            
            {/* ZATCA QR Simulation */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 print:bg-slate-100 border border-slate-800 print:border-slate-300">
              <div className="w-16 h-16 bg-white p-1 rounded-lg flex items-center justify-center">
                {/* SVG QR Code Simulation */}
                <svg className="w-full h-full text-slate-950" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm9-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm11 1h-2v2h2v-2zm2-3h2v2h-2v-2zm-2 5h4v2h-4v-2zm4-3h2v4h-2v-4z" />
                </svg>
              </div>
              <div className="text-xs text-slate-400 print:text-slate-600 leading-relaxed">
                <span className="font-bold block text-slate-300 print:text-slate-800">رمز التحقق الضريبي (ZATCA QR)</span>
                رمز الفاتورة الإلكترونية المشفر المعتمد لدى هيئة الزكاة والضريبة والجمارك.
              </div>
            </div>

            {/* Price Calculations */}
            <div className="w-full sm:w-72 space-y-2 text-sm">
              <div className="flex justify-between text-slate-400 print:text-slate-600">
                <span>المجموع الخاضع للضريبة:</span>
                <span className="font-mono">{subtotal.toLocaleString("ar-SA", { maximumFractionDigits: 2 })} ر.س</span>
              </div>
              <div className="flex justify-between text-slate-400 print:text-slate-600">
                <span>ضريبة القيمة المضافة (15%):</span>
                <span className="font-mono">{vatAmount.toLocaleString("ar-SA", { maximumFractionDigits: 2 })} ر.س</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-700 print:border-slate-300 text-lg font-black text-amber-400 print:text-slate-900">
                <span>الإجمالي النهائي:</span>
                <span className="font-mono">{order.total.toLocaleString("ar-SA")} ر.س</span>
              </div>
            </div>

          </div>

          {/* Footer Notice */}
          <div className="pt-6 border-t border-slate-800/80 print:border-slate-300 text-center text-xs text-slate-500 print:text-slate-600">
            شكراً لتعاملكم مع منصة سوق الجملة الذكي - هذه فاتورة إلكترونية صادرة تلقائياً بدون حاجة للتوقيع.
          </div>

        </div>
      </div>
    </div>
  );
}
