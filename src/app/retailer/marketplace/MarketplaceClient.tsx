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
  AlertCircle
} from "@/components/Icons";
import { deauthenticateUser, submitOrder, addTransaction } from "@/app/actions";
import { useToast } from "@/components/Toast";

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
  orders
  , paymentProviders
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

  // Persist cart to localStorage and server whenever it changes
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

  // Compute available payment providers for current cart: global (storeId null) + providers for stores in cart
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

      // If user selected direct provider payment, generate a mock reference if none provided
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
      showToast("تم تقديم طلب الإيداع. سيتم تحديث رصيدك فور مراجعة المدير للعملية.", "success");
    } catch (err: any) {
      showToast(err.message || "حدث خطأ أثناء طلب الإيداع.", "error");
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-slate-800 bg-slate-50 font-sans" lang="ar" dir="rtl">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/10">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              سوق الجملة الذكي
            </h1>
            <span className="text-xs text-slate-500 font-medium">بوابة بقالة التجزئة</span>
          </div>
        </div>

        <div className="flex items-center space-x-4 space-x-reverse min-w-0 w-full md:w-auto">
          {/* Tabs Navigation */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto flex-nowrap w-full">
            <button 
              onClick={() => setActiveTab("browse")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "browse" 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Package className="w-4 h-4 md:hidden" />
              <span className="hidden md:inline">تصفح البضائع</span>
            </button>
            <button 
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "orders" 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShoppingBag className="w-4 h-4 md:hidden" />
              <span className="hidden md:inline">طلباتي</span>
            </button>
            <button 
              onClick={() => setActiveTab("wallet")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "wallet" 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Wallet className="w-4 h-4 md:hidden" />
              <span className="hidden md:inline">المحفظة المالية</span>
            </button>
          </div>

          {/* Wallet Mini-Info */}
          <div className="flex items-center bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
            <Wallet className="w-5 h-5 text-amber-500 ml-2" />
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold">الرصيد المتوفر</p>
              <p className="text-sm font-bold text-slate-800">{walletBalance.toLocaleString()} ر.ي</p>
            </div>
          </div>

          {/* User & Logout */}
          <div className="flex items-center bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
            <User className="w-4 h-4 text-blue-500 ml-2" />
            <span className="text-sm font-semibold text-slate-700">{user.name}</span>
          </div>

          <form action={deauthenticateUser}>
            <button 
              type="submit"
              className="p-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 rounded-xl transition-all cursor-pointer"
              title="تسجيل خروج"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        </div>
      </header>

      {/* Main Content Space */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        
        {activeTab === "browse" && (
          <div className="space-y-6">
            
            {/* Search & Categories Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Category selector */}
              <div className="flex items-center space-x-2 space-x-reverse overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === null 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" 
                      : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  الكل
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedCategory === cat.id 
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" 
                        : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-full md:w-80">
                <Search className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث عن منتج، علامة تجارية أو تاجر..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-10 pl-4 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Products List Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center space-y-4 shadow-sm">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
                <div>
                  <h3 className="text-lg font-bold text-slate-700">لم نجد أي بضائع مطابقة</h3>
                  <p className="text-sm text-slate-400 mt-1">تأكد من كتابة الاسم بشكل صحيح أو تصفح الأقسام الأخرى.</p>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((prod) => (
                  <div 
                    key={prod.id} 
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-blue-200 shadow-sm hover:shadow-md transition-all flex flex-col group"
                  >
                    {/* Image placeholder with premium styling */}
                    <div className="h-44 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center relative border-b border-slate-100 p-4">
                      <Package className="w-16 h-16 text-slate-300 group-hover:scale-105 transition-transform" />
                      <div className="absolute top-3 right-3 bg-slate-900/5 text-slate-700 border border-slate-900/5 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                        {prod.category?.name || "عام"}
                      </div>
                      {prod.stock === 0 && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center">
                          <span className="bg-red-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs">منتهي من المخزون</span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">
                          {prod.store.name}
                        </span>
                        <h3 className="font-bold text-slate-800 text-sm line-clamp-2 pt-1">{prod.name}</h3>
                        <p className="text-xs text-slate-400 line-clamp-1">{prod.description || "لا يوجد وصف إضافي"}</p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-slate-400 font-semibold">سعر الجملة</span>
                          <div>
                            <span className="text-lg font-black text-slate-800">{prod.price.toLocaleString()}</span>
                            <span className="text-xs text-slate-500 font-bold mr-1">ر.ي / {prod.packingUnit}</span>
                          </div>
                        </div>

                        <div className="flex justify-between text-xs text-slate-500 bg-slate-50 p-2 rounded-lg font-medium">
                          <span>الحد الأدنى (MOQ): <strong className="text-slate-800">{prod.moq} {prod.packingUnit}</strong></span>
                          <span>المتوفر: <strong className="text-slate-800">{prod.stock} {prod.packingUnit}</strong></span>
                        </div>

                        <button
                          onClick={() => addToCart(prod)}
                          disabled={prod.stock === 0}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold rounded-xl shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 disabled:shadow-none transition-all cursor-pointer flex items-center justify-center space-x-2 space-x-reverse text-sm"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>أضف إلى السلة</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-6">
            <h2 className="text-xl font-extrabold text-slate-800">تتبع ومراجعة الطلبات السابقة</h2>
            
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center space-y-4 shadow-sm">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
                <div>
                  <h3 className="text-lg font-bold text-slate-700">لا توجد طلبات مسجلة بعد</h3>
                  <p className="text-sm text-slate-400 mt-1">تصفح البضائع وقم بإرسال طلبك الأول للموردين.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400 font-bold">رقم الطلب</p>
                        <p className="text-sm font-mono font-bold text-slate-800">{order.id.slice(0, 8).toUpperCase()}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-slate-400 font-bold">تاريخ الطلب</p>
                        <p className="text-sm font-semibold text-slate-700">
                          {new Date(order.createdAt).toLocaleDateString("ar-YE", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-slate-400 font-bold">طريقة الدفع</p>
                        <span className="text-xs bg-slate-200/60 text-slate-700 border border-slate-300/40 px-2.5 py-1 rounded font-bold">
                          {order.paymentMethod === "WALLET" ? "المحفظة الإلكترونية" : order.paymentMethod === "BANK_TRANSFER" ? "حوالة مصرفية" : order.paymentMethod === "MOBILE_WALLET" ? "محفظة محلية" : "الدفع عند الاستلام"}
                        </span>
                        {order.paymentProvider?.name && (
                          <p className="text-[10px] text-slate-500 mt-1">
                            الموفر: <span className="font-semibold text-slate-700">{order.paymentProvider.name}</span>
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-slate-400 font-bold">إجمالي الطلب</p>
                        <p className="text-sm font-black text-blue-600">{order.total.toLocaleString()} ر.ي</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-slate-400 font-bold">الحالة</p>
                        <span className={`inline-flex items-center space-x-1.5 space-x-reverse text-xs font-bold px-3 py-1 rounded-lg border ${
                          order.status === "DELIVERED"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : order.status === "PENDING"
                            ? "bg-amber-50 text-amber-600 border-amber-100"
                            : order.status === "CANCELLED"
                            ? "bg-red-50 text-red-600 border-red-100"
                            : "bg-blue-50 text-blue-600 border-blue-100"
                        }`}>
                          {order.status === "PENDING" && <Clock className="w-3.5 h-3.5" />}
                          {order.status === "ACCEPTED" && <CheckCircle className="w-3.5 h-3.5" />}
                          {order.status === "PREPARING" && <Package className="w-3.5 h-3.5" />}
                          {order.status === "SHIPPED" && <Truck className="w-3.5 h-3.5" />}
                          {order.status === "DELIVERED" && <CheckCircle className="w-3.5 h-3.5" />}
                          <span>
                            {order.status === "PENDING" && "بانتظار القبول"}
                            {order.status === "ACCEPTED" && "مقبول لدى المورد"}
                            {order.status === "PREPARING" && "قيد التجهيز"}
                            {order.status === "SHIPPED" && "قيد الشحن والتوصيل"}
                            {order.status === "DELIVERED" && "تم التسليم بنجاح"}
                            {order.status === "CANCELLED" && "ملغي"}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider pb-3">
                            <th className="pb-3">المنتج</th>
                            <th className="pb-3">المورد</th>
                            <th className="pb-3 text-center">الكمية</th>
                            <th className="pb-3 text-left">السعر الإجمالي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {order.items.map((item) => (
                            <tr key={item.id} className="text-sm font-semibold text-slate-700">
                              <td className="py-4 flex items-center space-x-3 space-x-reverse">
                                <span className="p-2 bg-slate-100 rounded-lg"><Package className="w-4 h-4 text-slate-400" /></span>
                                <span>{item.product.name}</span>
                              </td>
                              <td className="py-4 text-xs text-blue-600">{item.product.store.name}</td>
                              <td className="py-4 text-center">{item.quantity} {item.product.packingUnit}</td>
                              <td className="py-4 text-left font-bold text-slate-800">{(item.price * item.quantity).toLocaleString()} ر.ي</td>
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

        {activeTab === "wallet" && (
          <div className="grid md:grid-cols-12 gap-8">
            
            {/* Left: Top-up Form */}
            <div className="md:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">شحن رصيد المحفظة</h2>
                <p className="text-xs text-slate-400 mt-1">أرسل حوالة مصرفية للمركز، ثم أدخل تفاصيلها لشحن حسابك.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-2 text-xs font-medium text-slate-600">
                <h4 className="font-bold text-slate-700">معلومات الحساب المعتمد للإيداع:</h4>
                <p>بنك الكريمي: <strong className="text-slate-900 font-mono">102938475</strong></p>
                <p>جوال باي (Jawal Pay): <strong className="text-slate-900 font-mono">777123456</strong></p>
                <p>النجم للتحويلات: <strong className="text-slate-900">مكتب سوق الجملة الذكي</strong></p>
              </div>

              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">المبلغ المطلوب إيداعه (ر.ي)</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    required
                    placeholder="أدخل المبلغ مثل: 50000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">رقم المرجع / الإشعار المالي</label>
                  <input
                    type="text"
                    value={depositRef}
                    onChange={(e) => setDepositRef(e.target.value)}
                    required
                    placeholder="مثال: رقم السند أو كود التحويل"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isDepositing}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 space-x-reverse"
                >
                  <Wallet className="w-4 h-4" />
                  <span>{isDepositing ? "إرسال الطلب..." : "تقديم طلب الشحن"}</span>
                </button>
              </form>
            </div>

            {/* Right: History Log */}
            <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <h2 className="text-lg font-extrabold text-slate-800">سجل المعاملات المالية</h2>
              
              {transactions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">لا توجد حركات مالية مسجلة بعد.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="py-4 flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className={`p-2 rounded-xl ${
                          tx.type === "DEPOSIT" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                        }`}>
                          <Wallet className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">
                            {tx.type === "DEPOSIT" ? "طلب شحن رصيد" : "شراء بضاعة"}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            مرجع: <span className="font-mono">{tx.reference || "بدون"}</span> • {new Date(tx.createdAt).toLocaleDateString("ar-YE")}
                          </p>
                        </div>
                      </div>

                      <div className="text-left">
                        <p className={`font-black ${
                          tx.type === "DEPOSIT" ? "text-emerald-600" : "text-slate-800"
                        }`}>
                          {tx.type === "DEPOSIT" ? "+" : "-"}{tx.amount.toLocaleString()} ر.ي
                        </p>
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded mt-1 border ${
                          tx.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : tx.status === "PENDING"
                            ? "bg-amber-50 text-amber-600 border-amber-100"
                            : "bg-red-50 text-red-600 border-red-100"
                        }`}>
                          {tx.status === "PENDING" && "بانتظار التأكيد"}
                          {tx.status === "COMPLETED" && "مكتملة"}
                          {tx.status === "REJECTED" && "مرفوضة"}
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

      {/* Cart Slider Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            {/* Backdrop */}
            <div 
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            ></div>

            {/* Panel */}
            <div className="fixed inset-y-0 left-0 max-w-full flex pr-10">
              <div className="w-screen max-w-md animate-slide-right">
                <div className="h-full flex flex-col bg-white shadow-2xl border-r border-slate-100 overflow-y-scroll">
                  
                  {/* Cart Header */}
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <ShoppingBag className="w-5 h-5 text-blue-600" />
                      <h2 className="text-lg font-extrabold text-slate-800">سلة التسوق الخاصة بك</h2>
                      <span className="bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded text-xs">
                        {cart.length} أصناف
                      </span>
                    </div>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Cart Items */}
                  <div className="flex-1 py-6 px-6 overflow-y-auto space-y-4">
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col justify-center items-center text-center space-y-3">
                        <ShoppingBag className="w-12 h-12 text-slate-200" />
                        <h3 className="font-bold text-slate-700">السلة فارغة حالياً</h3>
                        <p className="text-xs text-slate-400 max-w-xs">تصفح البضائع المتوفرة واملأ السلة بمتطلبات بقالتك.</p>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <div key={item.product.id} className="flex border border-slate-100 p-3 rounded-xl space-x-3 space-x-reverse hover:bg-slate-50/50 transition-colors">
                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg h-fit">
                            <Package className="w-5 h-5 text-slate-400" />
                          </div>

                          <div className="flex-1 space-y-1">
                            <h4 className="font-bold text-slate-800 text-xs line-clamp-1">{item.product.name}</h4>
                            <p className="text-[10px] text-blue-600 font-semibold">{item.product.store.name}</p>
                            <p className="text-xs font-bold text-slate-700">
                              {item.product.price.toLocaleString()} ر.ي <span className="text-[10px] font-medium text-slate-400">/ {item.product.packingUnit}</span>
                            </p>

                            <div className="flex items-center justify-between pt-2">
                              {/* Quantity adjuster */}
                              <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                                <button 
                                  onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                                  className="p-1 hover:bg-slate-50 text-slate-600 rounded-r-lg cursor-pointer"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="px-3 text-xs font-bold text-slate-800">{item.quantity}</span>
                                <button 
                                  onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                                  className="p-1 hover:bg-slate-50 text-slate-600 rounded-l-lg cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <button 
                                onClick={() => removeFromCart(item.product.id)}
                                className="text-slate-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Checkout & Summary Footer */}
                  {cart.length > 0 && (
                    <div className="border-t border-slate-100 p-6 space-y-6 bg-slate-50/50">
                      
                      {/* Price Details */}
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between text-slate-500 font-medium">
                          <span>سعر البضائع الإجمالي</span>
                          <span>{cartTotal.toLocaleString()} ر.ي</span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-medium">
                          <span>رسوم الخدمة والتوصيل</span>
                          <span className="text-emerald-600">مجاني (لفترة محدودة)</span>
                        </div>
                        <div className="flex justify-between text-slate-800 font-black text-base pt-2 border-t border-slate-200">
                          <span>المجموع الكلي</span>
                          <span>{cartTotal.toLocaleString()} ر.ي</span>
                        </div>
                      </div>

                      {/* Payment Selector */}
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-500">اختر وسيلة الدفع المناسبة:</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                            className={`p-3 border rounded-xl flex flex-col items-center justify-center space-y-1.5 transition-all text-center cursor-pointer ${
                              paymentMethod === "CASH_ON_DELIVERY"
                                ? "border-blue-500 bg-blue-50/20 text-blue-600"
                                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                            }`}
                          >
                            <Truck className="w-4 h-4" />
                            <span className="text-[10px] font-bold">الدفع عند الاستلام</span>
                          </button>

                          <button
                            onClick={() => setPaymentMethod("WALLET")}
                            className={`p-3 border rounded-xl flex flex-col items-center justify-center space-y-1.5 transition-all text-center cursor-pointer ${
                              paymentMethod === "WALLET"
                                ? "border-blue-500 bg-blue-50/20 text-blue-600"
                                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                            }`}
                          >
                            <Wallet className="w-4 h-4" />
                            <span className="text-[10px] font-bold">المحفظة الإلكترونية</span>
                          </button>

                          <button
                            onClick={() => setPaymentMethod("BANK_TRANSFER")}
                            className={`p-3 border rounded-xl flex flex-col items-center justify-center space-y-1.5 transition-all text-center cursor-pointer ${
                              paymentMethod === "BANK_TRANSFER"
                                ? "border-blue-500 bg-blue-50/20 text-blue-600"
                                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                            }`}
                          >
                            <Building className="w-4 h-4" />
                            <span className="text-[10px] font-bold">حوالة مصرفية</span>
                          </button>

                          <button
                            onClick={() => setPaymentMethod("MOBILE_WALLET")}
                            className={`p-3 border rounded-xl flex flex-col items-center justify-center space-y-1.5 transition-all text-center cursor-pointer ${
                              paymentMethod === "MOBILE_WALLET"
                                ? "border-blue-500 bg-blue-50/20 text-blue-600"
                                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                            }`}
                          >
                            <CreditCard className="w-4 h-4" />
                            <span className="text-[10px] font-bold">محفظة محلية / رمز شراء</span>
                          </button>
                        </div>

                        {/* Extra Input based on selection */}
                        {paymentMethod === "WALLET" && (
                          <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200 flex items-center space-x-2 space-x-reverse text-xs font-semibold">
                            <Wallet className="w-4 h-4 text-amber-500" />
                            <span className="text-slate-600">سيتم خصم المبلغ من رصيد محفظتك المتاح ({walletBalance.toLocaleString()} ر.ي).</span>
                          </div>
                        )}

                        {(paymentMethod === "BANK_TRANSFER" || paymentMethod === "MOBILE_WALLET") && (
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500">اختر المزود أو أدخل مرجع الحوالة:</label>
                            <div className="flex gap-2">
                              <select
                                value={paymentProviderId || ""}
                                onChange={(e) => setPaymentProviderId(e.target.value || null)}
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                              >
                                <option value="">-- اختر مزود الدفع --</option>
                                {availableProviders && availableProviders.map((p) => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>

                              <input
                                type="text"
                                value={bankReference}
                                onChange={(e) => setBankReference(e.target.value)}
                                placeholder="أو أدخل رقم المرجع/الكود هنا"
                                className="w-2/5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                              />
                            </div>

                            <div className="flex items-center gap-3">
                              <label className="text-sm font-medium">دفع مباشر من الموفر</label>
                              <input type="checkbox" checked={useDirectProviderPay} onChange={(e) => setUseDirectProviderPay(e.target.checked)} />
                              <span className="text-xs text-slate-500">(مثلاً تحويل فوري من محفظة "جيب" إلى حساب التاجر)</span>
                            </div>

                            {paymentProviderId && paymentProviders && (
                              <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                {paymentProviders.find((p) => p.id === paymentProviderId)?.accountNumber ? (
                                  <div>رقم الحساب: {paymentProviders.find((p) => p.id === paymentProviderId)?.accountNumber}</div>
                                ) : null}
                                {paymentProviders.find((p) => p.id === paymentProviderId)?.instructions && (
                                  <div className="mt-1">{paymentProviders.find((p) => p.id === paymentProviderId)?.instructions}</div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="space-y-4">
                          <label className="block text-xs font-bold text-slate-500">ملاحظات إضافية للمورد</label>
                          <textarea
                            value={orderNote}
                            onChange={(e) => setOrderNote(e.target.value)}
                            placeholder="اكتب أي تعليمات خاصة بالشحن أو ملاحظات المبلغ أو طلبات خاصة بالمورد..."
                            className="w-full min-h-[90px] bg-white border border-slate-200 rounded-2xl px-3 py-3 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        {isOrderReviewOpen && (
                          <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-2xl text-sm space-y-2">
                            <p className="font-bold">مراجعة الطلب</p>
                            <p>عدد الأصناف: {cart.length}</p>
                            <p>المبلغ الكلي: {cartTotal.toLocaleString()} ر.ي</p>
                            <p>طريقة الدفع: {paymentMethod === "WALLET" ? "محفظة" : paymentMethod === "BANK_TRANSFER" ? "حوالة مصرفية" : paymentMethod === "MOBILE_WALLET" ? "محفظة محلية" : "الدفع عند الاستلام"}</p>
                            {paymentProviderId && (
                              <p>مزود الدفع: {paymentProviders?.find((p) => p.id === paymentProviderId)?.name || "غير محدد"}</p>
                            )}
                            {orderNote && <p>ملاحظاتك: {orderNote}</p>}
                          </div>
                        )}

                      {/* Action Button */}
                      <button
                        onClick={handleCheckout}
                        disabled={isCheckingOut}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 transition-all cursor-pointer flex items-center justify-center space-x-2 space-x-reverse"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>{isCheckingOut ? "إرسال طلبك..." : isOrderReviewOpen ? "تأكيد الطلب وشراء البضائع" : "مراجعة الطلب"}</span>
                      </button>
                    </div>
                  </div>
                  )}

                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
