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
import { ThemeToggle } from "@/components/ThemeToggle";

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
  stats,
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

  const handleUserApproval = async (userId: string, currentStatus: boolean) => {
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

  const handleApproveDeposit = async (txId: string) => {
    setUpdatingId(txId);
    try {
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
    <div className="flex flex-col min-h-screen text-slate-100 bg-[#070a12] font-sans selection:bg-amber-500 selection:text-slate-950" lang="ar" dir="rtl">
      
      {/* Background Orbs */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 px-4 md:px-8 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 p-2.5 rounded-xl shadow-lg shadow-amber-500/20 font-black">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white">لوحة الإشراف العام العليا</h1>
              <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">Super Admin</span>
            </div>
            <p className="text-xs text-slate-400">إدارة المتاجر والمحافظ والعمليات المالية</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse min-w-0 w-full md:w-auto overflow-x-auto hide-scrollbar">
          {/* Navigation Tabs */}
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 shrink-0">
            <button 
              onClick={() => setActiveTab("stores")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "stores" ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <StoreIcon className="w-4 h-4" />
              <span>المتاجر ({stats.pendingStoresCount})</span>
            </button>
            <button 
              onClick={() => setActiveTab("transactions")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "transactions" ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>الإيداعات ({stats.pendingDepositsCount})</span>
            </button>
            <button 
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "orders" ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>سجل الطلبات ({orders.length})</span>
            </button>
            <button 
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "users" ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>الأعضاء ({users.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <ThemeToggle />
            <form action={deauthenticateUser}>
              <button 
                type="submit"
                className="p-2.5 bg-slate-900/90 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800 rounded-xl transition-all cursor-pointer"
                title="تسجيل خروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 relative z-10">
        
        {/* KPI Analytics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs text-slate-400 font-semibold">تجار الجملة المعتمدين</span>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <StoreIcon className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-black text-blue-400">{stats.wholesalersCount} تاجر</h3>
            <p className="text-[10px] text-slate-500 mt-1">تجار جملة بالموقع</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs text-slate-400 font-semibold">متاجر بانتظار الاعتماد</span>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-black text-amber-400">{stats.pendingStoresCount} طلبات</h3>
            <p className="text-[10px] text-slate-500 mt-1">تحتاج موافقة المشرف</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs text-slate-400 font-semibold">إيداعات بانتظار الشحن</span>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-black text-emerald-400">{stats.pendingDepositsCount} طلبات</h3>
            <p className="text-[10px] text-slate-500 mt-1">طلبات شحن المحافظ</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs text-slate-400 font-semibold">إجمالي حجم المبيعات</span>
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-black text-purple-400">{stats.totalVolume.toLocaleString()} ر.ي</h3>
            <p className="text-[10px] text-slate-500 mt-1">حجم تداولات المنصة الكلي</p>
          </div>
        </div>

        {/* Tab 1: Stores List */}
        {activeTab === "stores" && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">إدارة اعتماد متاجر الجملة</h2>
                <p className="text-xs text-slate-400 mt-1">اعتمد المتاجر لتظهر بضائعهم تلقائياً لأصحاب البقالات</p>
              </div>
            </div>

            <div className="space-y-3">
              {stores.map((st) => (
                <div key={st.id} className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${st.isVerified ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                      <StoreIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{st.name}</h4>
                      <p className="text-xs text-slate-400">المالك: {st.owner.name} ({st.owner.email})</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${st.isVerified ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                      {st.isVerified ? "معتمد ورسمي" : "قيد المراجعة"}
                    </span>
                    <button
                      onClick={() => handleVerifyStore(st.id, st.isVerified)}
                      disabled={updatingId === st.id}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        st.isVerified 
                          ? "bg-slate-900 text-red-400 border border-slate-800 hover:bg-red-500/10" 
                          : "btn-amber"
                      }`}
                    >
                      {st.isVerified ? "إلغاء الاعتماد" : "اعتماد المتجر الآن"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Deposit Approvals */}
        {activeTab === "transactions" && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 animate-fade-in">
            <div>
              <h2 className="text-lg font-bold text-white">مراجعة وإعتماد الإيداعات المالية (شحن المحافظ)</h2>
              <p className="text-xs text-slate-400 mt-1">تأكد من رقم المرجع والمبلغ قبل الموافقة على شحن حساب صاحب البقالة</p>
            </div>

            <div className="space-y-3">
              {transactions.filter(t => t.type === "DEPOSIT").map((tx) => (
                <div key={tx.id} className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${tx.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{tx.user.name} ({tx.user.email})</h4>
                      <p className="text-xs font-mono text-amber-400 mt-0.5">مرجع الإيداع: {tx.reference || "بدون مرجع"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <p className="text-base font-black text-emerald-400">+{tx.amount.toLocaleString()} ر.ي</p>
                      <span className="text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleDateString("ar-YE")}</span>
                    </div>

                    {tx.status === "PENDING" ? (
                      <button
                        onClick={() => handleApproveDeposit(tx.id)}
                        disabled={updatingId === tx.id}
                        className="btn-amber px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        تأكيد وشحن المحفظة
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                        تم الشحن
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: System Orders */}
        {activeTab === "orders" && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 animate-fade-in">
            <div>
              <h2 className="text-lg font-bold text-white">سجل جميع طلبات ومبيعات المنصة</h2>
              <p className="text-xs text-slate-400 mt-1">متابعة دقيقة لكافة الطلبات المتبادلة بين التجار والبقالات</p>
            </div>

            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="glass-card rounded-2xl overflow-hidden border border-slate-800">
                  <div className="bg-slate-900/80 px-6 py-4 border-b border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">العميل:</span> <strong className="text-white">{order.retailer.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">إجمالي الطلب:</span> <strong className="text-amber-400">{order.total.toLocaleString()} ر.ي</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">الحالة:</span> <strong className="text-blue-400">{order.status}</strong>
                    </div>
                  </div>
                  <div className="p-4 text-xs space-y-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-slate-300">
                        <span>• {item.product.name} ({item.product.store.name})</span>
                        <span>{item.quantity} {item.product.packingUnit} × {item.price.toLocaleString()} ر.ي</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: User Accounts */}
        {activeTab === "users" && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 animate-fade-in">
            <div>
              <h2 className="text-lg font-bold text-white">إدارة أعضاء وحسابات النظام</h2>
              <p className="text-xs text-slate-400 mt-1">تفعيل أو تعليق وصول المستخدمين</p>
            </div>

            <div className="space-y-3">
              {users.map((usr) => (
                <div key={usr.id} className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{usr.name}</h4>
                      <p className="text-xs text-slate-400">{usr.email} | دور: <span className="text-amber-400 font-bold">{usr.role}</span></p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUserApproval(usr.id, usr.isApproved)}
                    disabled={updatingId === usr.id}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      usr.isApproved 
                        ? "bg-slate-900 text-emerald-400 border border-emerald-500/30" 
                        : "btn-amber"
                    }`}
                  >
                    {usr.isApproved ? "حساب مفعل (إيقاف)" : "تفعيل الحساب الآن"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
