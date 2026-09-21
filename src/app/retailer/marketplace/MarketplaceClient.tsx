"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  ShoppingBag, 
  Wallet, 
  LogOut, 
  Search, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Truck, 
  Package, 
  Plus, 
  Minus,
  X,
  CreditCard,
  Building,
  User,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  Shield
} from "@/components/Icons";
import { deauthenticateUser, submitOrder, addTransaction } from "@/app/actions";
import { useToast } from "@/components/Toast";
import { TaxInvoiceModal } from "@/components/TaxInvoiceModal";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price: number;
  moq: number;
  packingUnit: string;
  stock: number;
  imageUrl: string | null;
  storeId: string;
  categoryId: string | null;
  store: {
    name: string;
  };
  category: {
    name: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  reference: string | null;
  createdAt: Date;
}

interface Order {
  id: string;
  status: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentProvider?: {
    name: string;
    accountNumber?: string | null;
    instructions?: string | null;
  } | null;
  createdAt: Date;
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

interface MarketplaceClientProps {
  user: {
    name: string;
    email: string;
  };
  products: Product[];
  categories: Category[];
  transactions: Transaction[];
  walletBalance: number;
  orders: Order[];
  paymentProviders?: {
    id: string;
    name: string;
    accountNumber: string | null;
    instructions?: string | null;
    storeId?: string | null;
  }[];
}

export default function MarketplaceClient({
  user,
  products,
  categories,
  transactions,
  walletBalance,
  orders,
  paymentProviders
}: MarketplaceClientProps) {
  const [activeTab, setActiveTab] = useState<"browse" | "orders" | "wallet">("browse");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Cart State
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH_ON_DELIVERY" | "WALLET" | "BANK_TRANSFER" | "MOBILE_WALLET">("CASH_ON_DELIVERY");
  const [paymentProviderId, setPaymentProviderId] = useState<string | null>(null);
  const [bankReference, setBankReference] = useState("");
  const [useDirectProviderPay, setUseDirectProviderPay] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  const [isOrderReviewOpen, setIsOrderReviewOpen] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null);
  
  // Wallet Top-up State
  const [depositAmount, setDepositAmount] = useState("");
  const [depositRef, setDepositRef] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const { showToast } = useToast();

  // Hydrate cart from localStorage and server on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadCart = async () => {
      let storedCart: { product: Product; quantity: number }[] = [];
      try {
        const raw = localStorage.getItem("wholesale_cart");
        if (raw) {
          storedCart = JSON.parse(raw) as { product: Product; quantity: number }[];
        }
      } catch (e) {
        storedCart = [];
      }

      setCart(storedCart);

      try {
        const res = await fetch("/api/retailer/cart");
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data.items)) return;

        const merged = new Map<string, number>();
        storedCart.forEach((item) => merged.set(item.product.id, item.quantity));
        data.items.forEach((item: { productId: string; quantity: number }) => {
          const currentQty = merged.get(item.productId) || 0;
          merged.set(item.productId, Math.max(currentQty, item.quantity));
        });

        const mergedCart = Array.from(merged.entries())
          .map(([productId, quantity]) => {
            const product = products.find((p) => p.id === productId);
            if (!product) return null;
            return { product, quantity };
          })
          .filter(Boolean) as { product: Product; quantity: number }[];

        if (mergedCart.length > 0) {
          setCart(mergedCart);
        }
      } catch (e) {
        // ignore server cart load if not available
      }
    };

    loadCart();
  }, [products]);

  // Persist cart to localStorage and server
  useEffect(() => {
    try {
      localStorage.setItem("wholesale_cart", JSON.stringify(cart));
    } catch (e) {
      // ignore
    }

    const syncCart = async () => {
      try {
        const payload = { items: cart.map((item) => ({ productId: item.product.id, quantity: item.quantity })) };
        const method = cart.length === 0 ? "DELETE" : "POST";
        await fetch("/api/retailer/cart", {
          method,
          headers: { "Content-Type": "application/json" },
          body: method === "DELETE" ? null : JSON.stringify(payload),
        });
      } catch (e) {
        // ignore sync failures
      }
    };

    syncCart();
  }, [cart]);

  // Filter Products
  const filteredProducts = products.filter((product) => {
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      product.store.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Cart Handlers
  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.id === product.id);
    const desiredQty = existing ? existing.quantity + product.moq : product.moq;
    if (desiredQty > product.stock) {
      showToast(`الكمية المطلوبة تتجاوز المخزون المتوفر (${product.stock} ${product.packingUnit})`, "error");
      return;
    }

    if (existing) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: desiredQty }
            : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: product.moq }]);
    }
    showToast(`تمت إضافة "${product.name}" إلى سلة الشراء بنجاح`, "success");
    setIsCartOpen(true);
  };

  const updateCartQuantity = (productId: string, newQty: number) => {
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return;

    if (newQty <= 0) {
      setCart(cart.filter((i) => i.product.id !== productId));
      return;
    }

    const minQty = item.product.moq;
    if (newQty < minQty) {
      showToast(`الحد الأدنى للطلب من هذا المنتج هو ${minQty} ${item.product.packingUnit}`, "warning");
      setCart(cart.map((i) =>
        i.product.id === productId ? { ...i, quantity: minQty } : i
      ));
      return;
    }

    if (newQty > item.product.stock) {
      showToast(`الكمية المطلوبة تتجاوز المخزون المتوفر (${item.product.stock} ${item.product.packingUnit})`, "error");
      return;
    }

    setCart(
      cart.map((i) =>
        i.product.id === productId ? { ...i, quantity: newQty } : i
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const availableProviders = useMemo(() => {
    if (!paymentProviders) return [];
    const storeIds = new Set(cart.map((c) => c.product.storeId));
    return paymentProviders.filter((p) => !p.storeId || storeIds.has(p.storeId));
  }, [paymentProviders, cart]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    if (paymentMethod === "WALLET" && walletBalance < cartTotal) {
      showToast("رصيد المحفظة الخاص بك غير كافٍ لإتمام العملية.", "error");
      return;
    }

    if (paymentMethod === "BANK_TRANSFER" && !bankReference.trim()) {
      showToast("الرجاء إدخال رقم مرجع التحويل المصرفي.", "warning");
      return;
    }

    if (!isOrderReviewOpen) {
      setIsOrderReviewOpen(true);
      return;
    }

    setIsCheckingOut(true);
    try {
      const itemsPayload = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      }));

      let providerRef = bankReference;
      if (paymentMethod === "MOBILE_WALLET" && useDirectProviderPay) {
        providerRef = providerRef || `DIRECT-${Date.now()}`;
      }

      await submitOrder(
        itemsPayload,
        paymentMethod,
        paymentProviderId,
        providerRef,
        orderNote
      );

      setCart([]);
      setOrderNote("");
      setIsCartOpen(false);
      setActiveTab("orders");
      showToast("تم إرسال طلبك بنجاح وجارٍ مراجعته من قبل التجار.", "success");
      setIsOrderReviewOpen(false);
    } catch (err: any) {
      showToast(err.message || "حدث خطأ أثناء تقديم الطلب.", "error");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0 || !depositRef) {
      showToast("الرجاء تعبئة جميع الحقول بشكل صحيح.", "warning");
      return;
    }

    setIsDepositing(true);
    try {
      await addTransaction(parseFloat(depositAmount), "DEPOSIT", depositRef);
      setDepositAmount("");
      setDepositRef("");
      showToast("تم تقديم طلب الإيداع. سيتم تحديث رصيدك فور مراجعة المشرف للعملية.", "success");
    } catch (err: any) {
      showToast(err.message || "حدث خطأ أثناء طلب الإيداع.", "error");
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-slate-100 bg-[#070a12] font-sans selection:bg-amber-500 selection:text-slate-950" lang="ar" dir="rtl">
      
      {/* Dynamic Background Ambient Light */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[160px] pointer-events-none"></div>

      {/* Top Glass Navbar */}
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 px-4 md:px-8 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 p-2.5 rounded-xl shadow-lg shadow-amber-500/20 font-black">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight gradient-text-amber">
                سوق الجملة الذكي
              </h1>
              <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">سوق التجزئة</span>
            </div>
            <p className="text-xs text-slate-400">بوابة طلبات أصحاب البقالات</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse min-w-0 w-full md:w-auto overflow-x-auto hide-scrollbar">
          {/* Main Navigation Tabs */}
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 shrink-0">
            <button 
              onClick={() => setActiveTab("browse")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "browse" 
                  ? "bg-amber-500 text-slate-950 shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>تصفح البضائع</span>
            </button>
            <button 
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "orders" 
                  ? "bg-amber-500 text-slate-950 shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>طلباتي ({orders.length})</span>
            </button>
            <button 
              onClick={() => setActiveTab("wallet")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "wallet" 
                  ? "bg-amber-500 text-slate-950 shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>المحفظة</span>
            </button>
          </div>

          {/* Wallet Balance Pill */}
          <div 
            onClick={() => setActiveTab("wallet")}
            className="flex items-center bg-slate-900/90 border border-amber-500/20 px-3.5 py-2 rounded-xl cursor-pointer hover:border-amber-500/40 transition-colors shrink-0"
          >
            <Wallet className="w-4 h-4 text-amber-400 ml-2" />
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold">رصيد المحفظة</p>
              <p className="text-xs font-black text-amber-400">{walletBalance.toLocaleString()} ر.ي</p>
            </div>
          </div>

          {/* Cart Trigger Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-2"
          >
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            {cart.length > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                {cart.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            )}
          </button>

          {/* User Info, Theme Toggle & Logout */}
          <div className="flex items-center gap-2.5 shrink-0">
            <ThemeToggle />
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-200">{user.name}</span>
              <span className="text-[10px] text-slate-400">{user.email}</span>
            </div>
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

      {/* Main Container */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full relative z-10">
        
        {/* Browse Products Tab */}
        {activeTab === "browse" && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Search & Categories Filter Panel */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
              
              {/* Category Pills */}
              <div className="flex items-center space-x-2 space-x-reverse overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === null 
                      ? "btn-amber" 
                      : "bg-slate-900/80 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  الكل ({products.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedCategory === cat.id 
                        ? "btn-amber" 
                        : "bg-slate-900/80 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <Search className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="ابحث عن منتج، ماركة، أو تاجر جملة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full glass-input rounded-xl py-2.5 pr-10 pl-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="glass-panel rounded-3xl p-16 text-center space-y-4 border border-slate-800">
                <AlertCircle className="w-12 h-12 text-slate-600 mx-auto" />
                <div>
                  <h3 className="text-base font-bold text-slate-300">لم نجد أي بضائع مطابقة للبحث</h3>
                  <p className="text-xs text-slate-500 mt-1">جرب البحث بكلمات أخرى أو اختر قسماً مختلفاً من الأعلى.</p>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {filteredProducts.map((prod) => {
                  const stockPercent = Math.min(100, Math.round((prod.stock / (prod.moq * 10 || 100)) * 100));
                  return (
                    <div 
                      key={prod.id} 
                      className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between group border border-slate-800/80 hover:border-amber-500/30 transition-all duration-300"
                    >
                      {/* Product Image or SVG Banner */}
                      <div className="h-40 w-full bg-slate-900/80 relative overflow-hidden flex items-center justify-center border-b border-slate-800/60">
                        {prod.imageUrl ? (
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-4 text-slate-600 group-hover:text-amber-500/70 transition-colors">
                            <Package className="w-12 h-12 mb-1" />
                            <span className="text-[10px] text-slate-500">{prod.store.name}</span>
                          </div>
                        )}

                        {/* Badges Overlay */}
                        <div className="absolute top-3 right-3 left-3 flex items-center justify-between pointer-events-none">
                          <span className="text-[11px] font-bold text-blue-300 bg-slate-950/80 backdrop-blur-md border border-blue-500/30 px-2.5 py-1 rounded-lg">
                            {prod.store.name}
                          </span>
                          <span className="text-[10px] text-amber-300 bg-slate-950/80 backdrop-blur-md border border-amber-500/30 px-2 py-0.5 rounded-md font-bold">
                            {prod.category?.name || "عام"}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <h3 className="font-bold text-slate-100 text-sm line-clamp-2 leading-snug">{prod.name}</h3>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{prod.description || "بضاعة بالجملة جاهزة للتسليم المباشر."}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-800/60 space-y-3">
                          
                          {/* Price & Packaging */}
                          <div className="flex items-baseline justify-between">
                            <span className="text-xs text-slate-400 font-semibold">سعر الجملة</span>
                            <div className="text-left">
                              <span className="text-lg font-black text-amber-400">{prod.price.toLocaleString()}</span>
                              <span className="text-xs text-slate-400 font-bold mr-1">ر.ي / {prod.packingUnit}</span>
                            </div>
                          </div>

                          {/* MOQ & Stock Pill */}
                          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-300">
                            <div className="flex justify-between items-center text-[11px]">
                              <span>الحد الأدنى (MOQ): <strong className="text-amber-400">{prod.moq} {prod.packingUnit}</strong></span>
                              <span>المتوفر: <strong className={prod.stock > 0 ? "text-emerald-400" : "text-red-400"}>{prod.stock}</strong></span>
                            </div>

                            {/* Stock Bar */}
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all ${prod.stock > 20 ? "bg-emerald-400" : prod.stock > 0 ? "bg-amber-400" : "bg-red-500"}`}
                                style={{ width: `${Math.max(5, stockPercent)}%` }}
                              ></div>
                            </div>
                          </div>

                          <button
                            onClick={() => addToCart(prod)}
                            disabled={prod.stock === 0}
                            className="w-full py-2.5 btn-amber text-slate-950 font-bold rounded-xl disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center space-x-2 space-x-reverse text-xs"
                          >
                            <ShoppingBag className="w-4 h-4" />
                            <span>{prod.stock === 0 ? "منتهي من المخزون" : "إضافة للسلة"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Orders Tracking Tab */}
        {activeTab === "orders" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-100">متابعة وتتبع الطلبات</h2>
                <p className="text-xs text-slate-400 mt-1">سجل الطلبات الواردة من الموردين وتتبع حالة التوصيل</p>
              </div>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                إجمالي الطلبات: {orders.length}
              </span>
            </div>
            
            {orders.length === 0 ? (
              <div className="glass-panel rounded-3xl p-16 text-center space-y-4 border border-slate-800">
                <AlertCircle className="w-12 h-12 text-slate-600 mx-auto" />
                <div>
                  <h3 className="text-base font-bold text-slate-300">لا توجد طلبات سابقة حتى الآن</h3>
                  <p className="text-xs text-slate-500 mt-1">قم بتصفح البضائع وإرسال طلبك الأول للموزعين.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="glass-card rounded-2xl overflow-hidden border border-slate-800">
                    
                    {/* Header Bar */}
                    <div className="bg-slate-900/80 px-6 py-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">رقم الطلب</p>
                        <p className="text-xs font-mono font-bold text-amber-400">#{order.id.slice(0, 8).toUpperCase()}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 font-bold">التاريخ</p>
                        <p className="text-xs font-semibold text-slate-200">
                          {new Date(order.createdAt).toLocaleDateString("ar-YE", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 font-bold">طريقة الدفع</p>
                        <span className="text-[11px] bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-0.5 rounded-md font-semibold">
                          {order.paymentMethod === "WALLET" ? "المحفظة الرقمية" : order.paymentMethod === "BANK_TRANSFER" ? "تحويل مصرفي" : "الدفع عند الاستلام"}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 font-bold">المبلغ الإجمالي</p>
                        <p className="text-sm font-black text-amber-400">{order.total.toLocaleString()} ر.ي</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-400 font-bold">حالة الطلب</p>
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg border ${
                            order.status === "DELIVERED"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : order.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                              : order.status === "CANCELLED"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}>
                            {order.status === "PENDING" && <Clock className="w-3.5 h-3.5" />}
                            {order.status === "ACCEPTED" && <CheckCircle className="w-3.5 h-3.5" />}
                            {order.status === "PREPARING" && <Package className="w-3.5 h-3.5" />}
                            {order.status === "SHIPPED" && <Truck className="w-3.5 h-3.5" />}
                            {order.status === "DELIVERED" && <CheckCircle className="w-3.5 h-3.5" />}
                            <span>
                              {order.status === "PENDING" && "بانتظار قبول الموزع"}
                              {order.status === "ACCEPTED" && "تم قبول الطلب"}
                              {order.status === "PREPARING" && "جاري التحضير بالمستودع"}
                              {order.status === "SHIPPED" && "قيد الشحن والتوصيل"}
                              {order.status === "DELIVERED" && "تم التسليم بنجاح"}
                              {order.status === "CANCELLED" && "ملغي"}
                            </span>
                          </span>
                        </div>

                        <button
                          onClick={() => setSelectedInvoiceOrder(order)}
                          className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>الفاتورة الضريبية</span>
                        </button>
                      </div>
                    </div>

                    {/* Order Items Table */}
                    <div className="p-6">
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-800/80 text-slate-400 font-bold pb-2">
                            <th className="pb-3">المنتج</th>
                            <th className="pb-3">المورد / المتجر</th>
                            <th className="pb-3 text-center">الكمية</th>
                            <th className="pb-3 text-left">السعر</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {order.items.map((item) => (
                            <tr key={item.id} className="text-slate-200">
                              <td className="py-3 font-semibold flex items-center gap-2">
                                <Package className="w-4 h-4 text-amber-400 shrink-0" />
                                <span>{item.product.name}</span>
                              </td>
                              <td className="py-3 text-blue-400">{item.product.store.name}</td>
                              <td className="py-3 text-center font-mono">{item.quantity} {item.product.packingUnit}</td>
                              <td className="py-3 text-left font-bold text-amber-400">{(item.price * item.quantity).toLocaleString()} ر.ي</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Wallet Tab */}
        {activeTab === "wallet" && (
          <div className="grid md:grid-cols-12 gap-8 animate-fade-in">
            
            {/* Top-up Form Panel */}
            <div className="md:col-span-5 glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 h-fit">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-amber-400" />
                  <span>طلب شحن رصيد المحفظة</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">قم بإيداع المبلغ عبر الحسابات المعتمودة ثم أرسل الطلب للمشرف</p>
              </div>

              {/* Bank Info Cards */}
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2 text-xs text-slate-300">
                <h4 className="font-bold text-amber-400 mb-2">حسابات الإيداع المعتمدة:</h4>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span>بنك الكريمي:</span>
                  <strong className="font-mono text-slate-100">102938475</strong>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span>جوال باي (Jawal Pay):</span>
                  <strong className="font-mono text-slate-100">777123456</strong>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span>النجم للتحويلات:</span>
                  <strong className="text-slate-100">مركز سوق الجملة الذكي</strong>
                </div>
              </div>

              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-right">
                    المبلغ المطلوب إيداعه (ر.ي)
                  </label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    required
                    placeholder="أدخل المبلغ مثل: 100000"
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-right">
                    رقم مرجع الإيداع / الإشعار المالي
                  </label>
                  <input
                    type="text"
                    value={depositRef}
                    onChange={(e) => setDepositRef(e.target.value)}
                    required
                    placeholder="رقم الحوالة أو المرجع"
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isDepositing}
                  className="w-full py-3.5 btn-amber rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{isDepositing ? "جاري إرسال الطلب..." : "إرسال طلب الشحن للمشرف"}</span>
                </button>
              </form>
            </div>

            {/* Transactions History Feed */}
            <div className="md:col-span-7 glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-white">سجل العمليات المالية والمحفظة</h2>
                  <p className="text-xs text-slate-400 mt-1">كشف بجميع عمليات الخصم والإيداع</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">الرصيد الحالي:</span>
                  <p className="text-lg font-black text-amber-400">{walletBalance.toLocaleString()} ر.ي</p>
                </div>
              </div>

              {transactions.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs">
                  لا توجد عمليات مالية سابقة حتى الآن.
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="glass-card p-4 rounded-2xl flex items-center justify-between border border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${tx.type === "DEPOSIT" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                          {tx.type === "DEPOSIT" ? <ArrowUpRight className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">
                            {tx.type === "DEPOSIT" ? "إيداع شحن محفظة" : "خصم قيمة طلب جملة"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">مرجع: {tx.reference || "N/A"}</p>
                        </div>
                      </div>

                      <div className="text-left space-y-1">
                        <p className={`text-sm font-black ${tx.type === "DEPOSIT" ? "text-emerald-400" : "text-slate-200"}`}>
                          {tx.type === "DEPOSIT" ? "+" : "-"}{tx.amount.toLocaleString()} ر.ي
                        </p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          tx.status === "COMPLETED" || tx.status === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : tx.status === "PENDING"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-red-500/10 text-red-400"
                        }`}>
                          {tx.status === "COMPLETED" || tx.status === "APPROVED" ? "مكتمل" : tx.status === "PENDING" ? "قيد المراجعة" : "مرفوض"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Cart Drawer Slide-Over */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in" dir="rtl" lang="ar">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>

          <div className="absolute inset-y-0 left-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md glass-panel border-r border-slate-800 shadow-2xl flex flex-col justify-between">
              
              {/* Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-bold text-white">سلة الشراء بالجملة</h2>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-slate-200 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {cart.length === 0 ? (
                  <div className="py-20 text-center space-y-3">
                    <ShoppingBag className="w-12 h-12 text-slate-700 mx-auto" />
                    <p className="text-xs text-slate-400">سلة الشراء فارغة حالياً</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.product.id} className="glass-card p-4 rounded-2xl flex justify-between items-center border border-slate-800">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-200">{item.product.name}</h4>
                        <p className="text-[10px] text-slate-400">{item.product.price.toLocaleString()} ر.ي / {item.product.packingUnit}</p>
                        <p className="text-xs font-black text-amber-400">{(item.product.price * item.quantity).toLocaleString()} ر.ي</p>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                        <button 
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - item.product.moq)}
                          className="p-1 text-slate-400 hover:text-slate-200"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-slate-100 font-mono px-1">{item.quantity}</span>
                        <button 
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + item.product.moq)}
                          className="p-1 text-slate-400 hover:text-slate-200"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 text-red-400 hover:text-red-300 ml-1 border-r border-slate-800 pr-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer & Checkout */}
              {cart.length > 0 && (
                <div className="p-6 border-t border-slate-800 space-y-4 bg-slate-950/60">
                  
                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">اختر طريقة الدفع</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("WALLET")}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                          paymentMethod === "WALLET" ? "bg-amber-500/15 border-amber-500 text-amber-400" : "bg-slate-900 border-slate-800 text-slate-400"
                        }`}
                      >
                        المحفظة الرقمية
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                          paymentMethod === "CASH_ON_DELIVERY" ? "bg-amber-500/15 border-amber-500 text-amber-400" : "bg-slate-900 border-slate-800 text-slate-400"
                        }`}
                      >
                        الدفع عند الاستلام
                      </button>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-slate-800">
                    <span className="text-slate-400">الإجمالي النهائي:</span>
                    <span className="text-lg font-black text-amber-400">{cartTotal.toLocaleString()} ر.ي</span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full py-3.5 btn-amber rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{isCheckingOut ? "جاري التجهيز..." : "تأكيد وإرسال الطلب"}</span>
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Tax Invoice Modal */}
      {selectedInvoiceOrder && (
        <TaxInvoiceModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}

    </div>
  );
}
