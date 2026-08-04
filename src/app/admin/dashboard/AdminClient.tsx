"use client";

import { useState } from "react";
import { 
  Shield, 
  Users, 
  Store as StoreIcon, 
  Wallet, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  FileText, 
  DollarSign, 
  Check, 
  X, 
  TrendingUp, 
  Clock, 
  ArrowUpRight, 
  Lock,
  Unlock
} from "@/components/Icons";
import { deauthenticateUser, toggleStoreVerification, toggleUserApproval, changeOrderStatus } from "@/app/actions";
import { useToast } from "@/components/Toast";

interface Store {
  id: string;
  name: string;
  description: string | null;
  isVerified: boolean;
  createdAt: Date;
  owner: {
    id: string;
    name: string;
    email: string;
    isApproved: boolean;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isApproved: boolean;
  createdAt: Date;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  reference: string | null;
  createdAt: Date;
  user: {
    name: string;
    email: string;
  };
}

interface Order {
  id: string;
  status: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: Date;
  retailer: {
    name: string;
  };
  items: {
    id: string;
    quantity: number;
    price: number;
    product: {
      name: string;
      packingUnit: string;
      store: {
        name: string;
      };
    };
  }[];
}

interface AdminClientProps {
  user: {
    name: string;
  };
  stores: Store[];
  users: User[];
  transactions: Transaction[];
  orders: Order[];
  stats: {
    totalVolume: number;
    pendingStoresCount: number;
    pendingDepositsCount: number;
    retailersCount: number;
    wholesalersCount: number;
  };
}

export default function AdminClient({
  user,
  stores,
  users,
  transactions,
  orders,
  stats
}: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<"stores" | "transactions" | "orders" | "users">("stores");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleVerifyStore = async (storeId: string, currentStatus: boolean) => {
    setUpdatingId(storeId);
    try {
      await toggleStoreVerification(storeId, !currentStatus);
      showToast(currentStatus ? "تم إلغاء اعتماد المتجر." : "تم اعتماد المتجر بنجاح وتفعيله للبقالات.", "success");
    } catch (err: any) {
      showToast(err.message || "حدث خطأ أثناء تعديل حالة المتجر.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApproveUser = async (userId: string, currentStatus: boolean) => {
    setUpdatingId(userId);
    try {
      await toggleUserApproval(userId, !currentStatus);
      showToast(currentStatus ? "تم إيقاف تفعيل حساب المستخدم." : "تم تفعيل حساب المستخدم بنجاح.", "success");
    } catch (err: any) {
      showToast(err.message || "حدث خطأ أثناء تعديل تفعيل حساب المستخدم.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // Action to Approve Deposit (Simulated using dynamic Server Action endpoint or local fetch)
  const handleApproveDeposit = async (txId: string) => {
    if (!confirm("هل تأكدت من وصول الحوالة المالية لحساب البنك وترغب في شحن المحفظة للعميل؟")) return;
    setUpdatingId(txId);
    try {
      // Send dynamic POST request to a mock router endpoint, or perform direct action
      const res = await fetch("/api/admin/approve-deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: txId }),
      });
      if (res.ok) {
        showToast("تم تأكيد الإيداع وشحن محفظة العميل بنجاح.", "success");
        window.location.reload();
      } else {
        const data = await res.json();
        showToast(data.error || "فشل تأكيد الإيداع.", "error");
      }
    } catch (err: any) {
      showToast("حدث خطأ أثناء الاتصال بالخادم.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="admin-theme min-h-screen text-slate-200 bg-[#080b11] font-sans pb-12" lang="ar" dir="rtl">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0f1422]/90 border-b border-[#1c2438] shadow-xl backdrop-blur-md px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="bg-gradient-to-r from-red-600 to-amber-600 text-slate-950 p-2.5 rounded-xl shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              لوحة الإشراف العام للمنصة
            </h1>
            <span className="text-xs text-slate-400 font-medium">سوق الجملة الذكي</span>
          </div>
        </div>

        <div className="flex items-center space-x-4 space-x-reverse min-w-0 w-full md:w-auto">
          {/* Main Navigation */}
          <div className="flex bg-[#080b11] p-1 rounded-xl border border-[#1c2438] overflow-x-auto flex-nowrap w-full">
            <button 
              onClick={() => setActiveTab("stores")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "stores" 
                  ? "bg-[#0f1422] text-amber-400 shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <StoreIcon className="w-4 h-4 md:hidden" />
              <span className="hidden md:inline">المتاجر والطلبات المعلقة ({stats.pendingStoresCount})</span>
            </button>
            <button 
              onClick={() => setActiveTab("transactions")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "transactions" 
                  ? "bg-[#0f1422] text-amber-400 shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Wallet className="w-4 h-4 md:hidden" />
              <span className="hidden md:inline">شحن المحافظ والمراجعات ({stats.pendingDepositsCount})</span>
            </button>
            <button 
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "orders" 
                  ? "bg-[#0f1422] text-amber-400 shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-4 h-4 md:hidden" />
              <span className="hidden md:inline">سجل المبيعات والطلبات</span>
            </button>
            <button 
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "users" 
                  ? "bg-[#0f1422] text-amber-400 shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="w-4 h-4 md:hidden" />
              <span className="hidden md:inline">إدارة الأعضاء</span>
            </button>
          </div>

          <form action={deauthenticateUser}>
            <button 
              type="submit"
              className="p-2.5 bg-[#0f1422] hover:bg-red-950/20 text-slate-400 hover:text-red-400 border border-[#1c2438] rounded-xl transition-all cursor-pointer"
              title="تسجيل خروج"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {/* Statistics Panels */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-[#0f1422] border border-[#1c2438] p-5 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-bold">حجم مبيعات المنصة</p>
              <p className="text-xl font-black text-white">{stats.totalVolume.toLocaleString()} <span className="text-xs text-slate-400 font-normal">ر.ي</span></p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#0f1422] border border-[#1c2438] p-5 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-bold">محلات التجزئة (بقالات)</p>
              <p className="text-xl font-black text-white">{stats.retailersCount}</p>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#0f1422] border border-[#1c2438] p-5 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-bold">تجار الجملة والموزعين</p>
              <p className="text-xl font-black text-white">{stats.wholesalersCount}</p>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
              <StoreIcon className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#0f1422] border border-[#1c2438] p-5 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-bold">متاجر بانتظار الاعتماد</p>
              <p className={`text-xl font-black ${stats.pendingStoresCount > 0 ? "text-amber-500" : "text-slate-400"}`}>{stats.pendingStoresCount}</p>
            </div>
            <div className={`p-3 rounded-xl ${stats.pendingStoresCount > 0 ? "bg-amber-500/10 text-amber-400" : "bg-slate-500/10 text-slate-400"}`}>
              <StoreIcon className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#0f1422] border border-[#1c2438] p-5 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-bold">إيداعات بانتظار التأكيد</p>
              <p className={`text-xl font-black ${stats.pendingDepositsCount > 0 ? "text-red-400 animate-pulse" : "text-slate-400"}`}>{stats.pendingDepositsCount}</p>
            </div>
            <div className={`p-3 rounded-xl ${stats.pendingDepositsCount > 0 ? "bg-red-500/10 text-red-400" : "bg-slate-500/10 text-slate-400"}`}>
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab Switchboard */}
        {activeTab === "stores" && (
          <div className="bg-[#0f1422] border border-[#1c2438] rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">إعتماد وتوثيق المتاجر (تجار الجملة)</h2>
              <p className="text-xs text-slate-400 mt-1">يجب على تجار الجملة الجدد الحصول على موافقتكم ليتمكنوا من عرض منتجاتهم في السوق.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-[#1c2438] text-xs font-bold text-slate-400 uppercase tracking-wider pb-3">
                    <th className="pb-3">اسم المتجر</th>
                    <th className="pb-3">المالك</th>
                    <th className="pb-3">البريد الإلكتروني</th>
                    <th className="pb-3">تاريخ التسجيل</th>
                    <th className="pb-3">الحالة</th>
                    <th className="pb-3 text-left">التحكم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c2438]">
                  {stores.map((store) => (
                    <tr key={store.id} className="text-sm font-semibold text-slate-300">
                      <td className="py-4 font-bold text-white flex items-center gap-2">
                        <span className="p-2 bg-[#1c2438] rounded-lg"><StoreIcon className="w-4 h-4 text-slate-400" /></span>
                        {store.name}
                      </td>
                      <td className="py-4">{store.owner.name}</td>
                      <td className="py-4 text-xs font-mono">{store.owner.email}</td>
                      <td className="py-4 text-xs">
                        {new Date(store.createdAt).toLocaleDateString("ar-YE")}
                      </td>
                      <td className="py-4">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
                          store.isVerified
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                          {store.isVerified ? "موزع معتمد" : "غير نشط/تحت المراجعة"}
                        </span>
                      </td>
                      <td className="py-4 text-left">
                        <button
                          onClick={() => handleVerifyStore(store.id, store.isVerified)}
                          disabled={updatingId === store.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            store.isVerified
                              ? "bg-red-950/40 hover:bg-red-950/60 text-red-400 border border-red-900/40"
                              : "bg-emerald-600 hover:bg-emerald-700 text-slate-950"
                          }`}
                        >
                          {store.isVerified ? "إلغاء الاعتماد" : "اعتماد وتفعيل المتجر"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="bg-[#0f1422] border border-[#1c2438] rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">طلبات شحن المحافظ والعمليات المالية</h2>
              <p className="text-xs text-slate-400 mt-1">قم بتدقيق الحوالات المصرفية المكتوبة من العملاء والموافقة عليها لشحن أرصدتهم فوراً.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-[#1c2438] text-xs font-bold text-slate-400 uppercase tracking-wider pb-3">
                    <th className="pb-3">المستخدم</th>
                    <th className="pb-3">نوع العملية</th>
                    <th className="pb-3">المبلغ</th>
                    <th className="pb-3">المرجع / كود التحويل</th>
                    <th className="pb-3">تاريخ الطلب</th>
                    <th className="pb-3">الحالة</th>
                    <th className="pb-3 text-left">التحكم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c2438]">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="text-sm font-semibold text-slate-300">
                      <td className="py-4">
                        <p className="text-white font-bold">{tx.user.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{tx.user.email}</p>
                      </td>
                      <td className="py-4">
                        <span className={`text-xs ${tx.type === "DEPOSIT" ? "text-emerald-400" : "text-blue-400"}`}>
                          {tx.type === "DEPOSIT" ? "إيداع (شحن محفظة)" : "شراء بضاعة"}
                        </span>
                      </td>
                      <td className="py-4 font-black text-white">{tx.amount.toLocaleString()} ر.ي</td>
                      <td className="py-4 text-xs font-mono font-bold text-amber-500">{tx.reference || "بدون مرجع"}</td>
                      <td className="py-4 text-xs">
                        {new Date(tx.createdAt).toLocaleString("ar-YE")}
                      </td>
                      <td className="py-4">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
                          tx.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : tx.status === "PENDING"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}>
                          {tx.status === "PENDING" && "تحت التدقيق"}
                          {tx.status === "COMPLETED" && "مكتملة ومقبولة"}
                          {tx.status === "REJECTED" && "مرفوضة"}
                        </span>
                      </td>
                      <td className="py-4 text-left">
                        {tx.type === "DEPOSIT" && tx.status === "PENDING" && (
                          <button
                            onClick={() => handleApproveDeposit(tx.id)}
                            disabled={updatingId === tx.id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            تأكيد الحوالة وشحن المحفظة
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="bg-[#0f1422] border border-[#1c2438] rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white">سجل كافة الطلبات والمبيعات على المنصة</h2>
            
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-[#151b2d]/40 border border-[#1c2438] rounded-xl overflow-hidden">
                  <div className="bg-[#0f1422] px-6 py-4 flex justify-between items-center border-b border-[#1c2438]">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-bold">بقالة المشتري</p>
                      <p className="text-sm font-bold text-white">{order.retailer.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-bold">الإجمالي الكلي</p>
                      <p className="text-sm font-black text-amber-500">{order.total.toLocaleString()} ر.ي</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-bold">طريقة الدفع</p>
                      <p className="text-xs text-slate-300">{order.paymentMethod === "WALLET" ? "محفظة رقمية" : "دفع كاش عند الاستلام"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-bold">حالة التوصيل</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        order.status === "DELIVERED"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {order.status === "PENDING" && "قيد الانتظار"}
                        {order.status === "ACCEPTED" && "مقبول لدى التاجر"}
                        {order.status === "PREPARING" && "قيد التجهيز"}
                        {order.status === "SHIPPED" && "قيد التوصيل"}
                        {order.status === "DELIVERED" && "مكتمل ومسلم"}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <ul className="text-xs space-y-2 text-slate-400">
                      {order.items.map((item) => (
                        <li key={item.id} className="flex justify-between">
                          <span>• {item.product.name} (عدد {item.quantity} {item.product.packingUnit})</span>
                          <span className="text-slate-300 font-bold">المورد: {item.product.store.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="bg-[#0f1422] border border-[#1c2438] rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white">إدارة حسابات الأعضاء والتحكم بالصلاحيات</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-[#1c2438] text-xs font-bold text-slate-400 uppercase tracking-wider pb-3">
                    <th className="pb-3">الاسم بالكامل</th>
                    <th className="pb-3">البريد الإلكتروني</th>
                    <th className="pb-3">الدور الممنوح</th>
                    <th className="pb-3">حالة الحساب</th>
                    <th className="pb-3 text-left">التحكم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c2438]">
                  {users.map((u) => (
                    <tr key={u.id} className="text-sm font-semibold text-slate-300">
                      <td className="py-4 font-bold text-white">{u.name}</td>
                      <td className="py-4 text-xs font-mono">{u.email}</td>
                      <td className="py-4 text-xs">
                        <span className={`px-2 py-0.5 rounded border font-bold text-[10px] ${
                          u.role === "ADMIN" 
                            ? "bg-red-500/10 text-red-400 border-red-500/20" 
                            : u.role === "WHOLESALER" 
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 text-xs">
                        <span className={`font-bold ${u.isApproved ? "text-emerald-400" : "text-red-400"}`}>
                          {u.isApproved ? "مفعّل ونشط" : "موقوف مؤقتاً"}
                        </span>
                      </td>
                      <td className="py-4 text-left">
                        {u.role !== "ADMIN" && (
                          <button
                            onClick={() => handleApproveUser(u.id, u.isApproved)}
                            disabled={updatingId === u.id}
                            className={`px-3 py-1 text-xs rounded transition-all cursor-pointer font-bold ${
                              u.isApproved
                                ? "bg-red-950/30 hover:bg-red-950/50 text-red-400 border border-red-900/30"
                                : "bg-emerald-600 hover:bg-emerald-700 text-slate-950"
                            }`}
                          >
                            {u.isApproved ? "حظر مؤقت" : "تفعيل الحساب"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
