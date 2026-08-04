"use client";

import React, { useState } from "react";

interface Provider {
  id: string;
  name: string;
  accountNumber?: string | null;
  instructions?: string | null;
}

export default function AdminPaymentProviders({ initialProviders }: { initialProviders: Provider[] }) {
  const [providers, setProviders] = useState<Provider[]>(initialProviders || []);
  const [name, setName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [instructions, setInstructions] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  async function fetchProviders() {
    const res = await fetch(`/api/admin/payment-providers`);
    const data = await res.json();
    setProviders(data.providers || []);
  }

  async function handleAddOrUpdate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!name.trim()) return alert("الرجاء إدخال اسم الموفر.");

    if (editingId) {
      await fetch(`/api/admin/payment-providers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, name, accountNumber, instructions }),
      });
      setEditingId(null);
    } else {
      await fetch(`/api/admin/payment-providers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, accountNumber, instructions }),
      });
    }

    setName("");
    setAccountNumber("");
    setInstructions("");
    await fetchProviders();
  }

  async function handleEdit(p: Provider) {
    setEditingId(p.id);
    setName(p.name || "");
    setAccountNumber(p.accountNumber || "");
    setInstructions(p.instructions || "");
  }

  async function handleDelete(id: string) {
    if (!confirm("هل تريد حذف هذا المزود؟")) return;
    await fetch(`/api/admin/payment-providers?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await fetchProviders();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddOrUpdate} className="grid grid-cols-1 gap-3 max-w-2xl">
        <div>
          <label className="block text-sm font-bold mb-1">اسم موفر الدفع</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg border" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">رقم الحساب / رقم المحفظة</label>
          <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full px-3 py-2 rounded-lg border" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">تعليمات الدفع (اختياري)</label>
          <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} className="w-full px-3 py-2 rounded-lg border" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">{editingId ? "حفظ التعديلات" : "إضافة موفر"}</button>
          <button type="button" onClick={() => { setEditingId(null); setName(""); setAccountNumber(""); setInstructions(""); }} className="px-4 py-2 bg-slate-200 rounded-lg">إلغاء</button>
        </div>
      </form>

      <div className="mt-6">
        <h3 className="text-lg font-black mb-2">قائمة مزوّدي الدفع</h3>
        <div className="grid gap-3">
          {providers.map((p) => (
            <div key={p.id} className="p-3 border rounded-lg flex justify-between items-start">
              <div>
                <div className="font-bold">{p.name}</div>
                {p.accountNumber && <div className="text-sm text-slate-600">رقم الحساب: {p.accountNumber}</div>}
                {p.instructions && <div className="text-sm text-slate-500 mt-1">{p.instructions}</div>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(p)} className="px-3 py-1 bg-amber-500 text-white rounded-lg">تعديل</button>
                <button onClick={() => handleDelete(p.id)} className="px-3 py-1 bg-red-600 text-white rounded-lg">حذف</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
