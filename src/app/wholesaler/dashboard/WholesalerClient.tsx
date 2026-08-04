"use client";

import { useState } from "react";
import { 
  TrendingUp, 
  Package, 
  ShoppingBag, 
  AlertTriangle, 
  Plus, 
  Edit, 
  Trash2, 
  LogOut, 
  CheckCircle,
  Truck,
  Layers,
  X,
  FileText,
  Clock,
  DollarSign
} from "@/components/Icons";
import { deauthenticateUser, addProduct, editProduct, removeProduct, changeOrderStatus, replyToOrder } from "@/app/actions";
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
  categoryId: string | null;
  category: {
    name: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
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
  paymentProvider?: {
    name: string;
    accountNumber?: string | null;
    instructions?: string | null;
  } | null;
  retailerNote?: string | null;
  sellerReply?: string | null;
  items: {
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      packingUnit: string;
      storeId: string;
      sku: string | null;
    };
  }[];
}

interface WholesalerClientProps {
  user: {
    name: string;
  };
  store: {
    id: string;
    name: string;
    description: string | null;
    isVerified: boolean;
  };
  products: Product[];
  categories: Category[];
  orders: Order[];
  stats: {
    totalRevenue: number;
    activeOrdersCount: number;
    outOfStockCount: number;
    totalProductsCount: number;
  };
}

export default function WholesalerClient({
  user,
  store,
  products,
  categories,
  orders,
  stats
}: WholesalerClientProps) {
  const [activeTab, setActiveTab] = useState<"orders" | "products" | "analytics">("orders");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [replyMessages, setReplyMessages] = useState<Record<string, string>>({});
  const [isReplySending, setIsReplySending] = useState(false);
  const { showToast } = useToast();

  // Form states
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodSku, setProdSku] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodMoq, setProdMoq] = useState("1");
  const [prodStock, setProdStock] = useState("");
  const [prodUnit, setProdUnit] = useState("كرتون");
  const [prodCategory, setProdCategory] = useState("");

  const resetForm = () => {
    setProdName("");
    setProdDesc("");
    setProdSku("");
    setProdPrice("");
    setProdMoq("1");
    setProdStock("");
    setProdUnit("كرتون");
    setProdCategory(categories[0]?.id || "");
    setEditingProduct(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdDesc(prod.description || "");
    setProdSku(prod.sku || "");
    setProdPrice(prod.price.toString());
    setProdMoq(prod.moq.toString());
    setProdStock(prod.stock.toString());
    setProdUnit(prod.packingUnit);
    setProdCategory(prod.categoryId || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice || !prodStock) {
      showToast("الرجاء إدخال الحقول المطلوبة.", "warning");
      return;
    }

    const payload = {
      name: prodName,
      description: prodDesc,
      sku: prodSku,
      price: parseFloat(prodPrice),
      moq: parseInt(prodMoq),
      packingUnit: prodUnit,
      stock: parseInt(prodStock),
      categoryId: prodCategory || null,
    };

    try {
      if (editingProduct) {
        await editProduct(editingProduct.id, payload);
        showToast("تم تحديث المنتج بنجاح.", "success");
      } else {
        await addProduct(payload);
        showToast("تم إضافة المنتج بنجاح.", "success");
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      showToast(err.message || "حدث خطأ أثناء حفظ المنتج.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج نهائياً من المتجر؟")) return;

    try {
      await removeProduct(id);
      showToast("تم حذف المنتج بنجاح.", "success");
    } catch (err: any) {
      showToast(err.message || "حدث خطأ أثناء حذف المنتج.", "error");
    }
  };

  const handleStatusUpdate = async (orderId: string, nextStatus: string) => {
    try {
      await changeOrderStatus(orderId, nextStatus);
      showToast("تم تحديث حالة الطلب.", "success");
    } catch (err: any) {
      showToast(err.message || "حدث خطأ أثناء تحديث حالة الطلب.", "error");
    }
  };

  const handleReplySubmit = async (orderId: string) => {
    const message = replyMessages[orderId]?.trim();
    if (!message) {
      showToast("الرجاء كتابة رسالة قبل الإرسال.", "warning");
      return;
    }

    setIsReplySending(true);
    try {
      await replyToOrder(orderId, message);
      showToast("تم إرسال ردك على الطلب.", "success");
      setReplyMessages((prev) => ({ ...prev, [orderId]: "" }));
    } catch (err: any) {
      showToast(err.message || "حدث خطأ أثناء إرسال الرد.", "error");
    } finally {
      setIsReplySending(false);
    }
  };

  return (
    <div className="wholesaler-theme min-h-screen text-slate-200 bg-[#0b0f19] font-sans pb-12" lang="ar" dir="rtl">
      
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-[#151b2d]/80 border-b border-[#222d4a] shadow-xl backdrop-blur-md px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 p-2.5 rounded-xl shadow-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              {store.name}
              {store.isVerified && (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">موزع معتمد</span>
              )}
            </h1>
            <span className="text-xs text-slate-400 font-medium">لوحة تحكم تاجر الجملة</span>
          </div>
        </div>

        <div className="flex items-center space-x-4 space-x-reverse min-w-0 w-full md:w-auto">
          {/* Main Navigation */}
          <div className="flex bg-[#0b0f19] p-1 rounded-xl border border-[#222d4a] overflow-x-auto flex-nowrap w-full">
            <button 
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "orders" 
                  ? "bg-[#151b2d] text-amber-400 shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShoppingBag className="w-4 h-4 md:hidden" />
              <span className="hidden md:inline">إدارة الطلبات</span>
            </button>
            <button 
              onClick={() => setActiveTab("products")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "products" 
                  ? "bg-[#151b2d] text-amber-400 shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Package className="w-4 h-4 md:hidden" />
              <span className="hidden md:inline">كتالوج المنتجات</span>
            </button>
            <button 
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "analytics" 
                  ? "bg-[#151b2d] text-amber-400 shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <TrendingUp className="w-4 h-4 md:hidden" />
              <span className="hidden md:inline">التحليلات والمبيعات</span>
            </button>
          </div>

          <form action={deauthenticateUser}>
            <button 
              type="submit"
              className="p-2.5 bg-[#151b2d] hover:bg-red-950/20 text-slate-400 hover:text-red-400 border border-[#222d4a] rounded-xl transition-all cursor-pointer"
              title="تسجيل خروج"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#151b2d] border border-[#222d4a] p-5 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-bold">إجمالي المبيعات النشطة</p>
              <p className="text-2xl font-black text-white">{stats.totalRevenue.toLocaleString()} <span className="text-xs text-slate-400 font-normal">ر.ي</span></p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-[#151b2d] border border-[#222d4a] p-5 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-bold">طلبات قيد المعالجة</p>
              <p className="text-2xl font-black text-white">{stats.activeOrdersCount}</p>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-[#151b2d] border border-[#222d4a] p-5 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-bold">إجمالي الأصناف بالمتجر</p>
              <p className="text-2xl font-black text-white">{stats.totalProductsCount}</p>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-[#151b2d] border border-[#222d4a] p-5 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-bold">أصناف نفدت كميتها</p>
              <p className={`text-2xl font-black ${stats.outOfStockCount > 0 ? "text-red-500" : "text-slate-400"}`}>{stats.outOfStockCount}</p>
            </div>
            <div className={`p-3 rounded-xl ${stats.outOfStockCount > 0 ? "bg-red-500/10 text-red-400" : "bg-slate-500/10 text-slate-400"}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tab contents */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white">الطلبات الواردة لمتجرك</h2>
            
            {orders.length === 0 ? (
              <div className="bg-[#151b2d] border border-[#222d4a] rounded-2xl py-16 text-center space-y-4">
                <FileText className="w-12 h-12 text-[#222d4a] mx-auto" />
                <h3 className="font-bold text-slate-400">لا توجد طلبات واردة حتى الآن</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">سيظهر هنا أي طلب جديد يرسله أصحاب البقالات لمتجرك.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => {
                  // Calculate store portion in this specific order
                  const storeItems = order.items.filter((item) => item.product.storeId === store.id);
                  const storeTotal = storeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

                  return (
                    <div key={order.id} className="bg-[#151b2d] border border-[#222d4a] rounded-2xl overflow-hidden shadow-lg">
                      <div className="bg-[#1e253c]/50 px-6 py-4 border-b border-[#222d4a] flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-400 font-bold">العميل التجزئة</p>
                          <p className="text-sm font-bold text-white">{order.retailer.name}</p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-400 font-bold">رقم وتاريخ الطلب</p>
                          <p className="text-xs text-slate-300 font-semibold">{order.id.slice(0, 8).toUpperCase()} • {new Date(order.createdAt).toLocaleDateString("ar-YE")}</p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-400 font-bold">حصتكم من الطلب</p>
                          <p className="text-sm font-black text-amber-400">{storeTotal.toLocaleString()} ر.ي</p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-400 font-bold">حالة الدفع</p>
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
                            order.paymentStatus === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}>
                            {order.paymentStatus === "COMPLETED" ? "مدفوع (محفظة)" : "الدفع عند الاستلام/معلق"}
                          </span>
                        </div>

                        {/* Order status controls */}
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {order.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(order.id, "ACCEPTED")}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                              >
                                قبول الطلب
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(order.id, "CANCELLED")}
                                className="px-3 py-1.5 bg-red-950/40 hover:bg-red-950/60 text-red-400 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                              >
                                رفض
                              </button>
                            </>
                          )}

                          {order.status === "ACCEPTED" && (
                            <button
                              onClick={() => handleStatusUpdate(order.id, "PREPARING")}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                            >
                              البدء بالتجهيز
                            </button>
                          )}

                          {order.status === "PREPARING" && (
                            <button
                              onClick={() => handleStatusUpdate(order.id, "SHIPPED")}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              شحن وتوصيل البضائع
                            </button>
                          )}

                          {order.status === "SHIPPED" && (
                            <button
                              onClick={() => handleStatusUpdate(order.id, "DELIVERED")}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                            >
                              تأكيد الاستلام والتسليم
                            </button>
                          )}

                          {order.status === "DELIVERED" && (
                            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              تم تسليم الطلب بنجاح
                            </span>
                          )}

                          {order.status === "CANCELLED" && (
                            <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg font-bold">
                              تم الإلغاء/الرفض
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-6">
                        <table className="w-full text-right border-collapse">
                          <thead>
                            <tr className="border-b border-[#222d4a] text-xs font-bold text-slate-400 uppercase tracking-wider pb-3">
                              <th className="pb-3">الصنف</th>
                              <th className="pb-3">الرمز البرمجي</th>
                              <th className="pb-3 text-center">الكمية المطلوبة</th>
                              <th className="pb-3 text-left">السعر الإجمالي</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#222d4a]">
                            {storeItems.map((item) => (
                              <tr key={item.id} className="text-sm font-semibold text-slate-300">
                                <td className="py-4 flex items-center space-x-3 space-x-reverse">
                                  <span className="p-2 bg-[#1e253c] rounded-lg"><Package className="w-4 h-4 text-slate-400" /></span>
                                  <span>{item.product.name}</span>
                                </td>
                                <td className="py-4 text-xs font-mono text-slate-400">{item.product.sku || "بدون SKU"}</td>
                                <td className="py-4 text-center">{item.quantity} {item.product.packingUnit}</td>
                                <td className="py-4 text-left font-bold text-white">{(item.price * item.quantity).toLocaleString()} ر.ي</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {order.retailerNote && (
                          <div className="mt-6 p-4 bg-slate-950/70 border border-slate-800 rounded-2xl">
                            <p className="text-xs text-slate-400 font-bold">ملاحظات العميل</p>
                            <p className="mt-2 text-sm text-slate-200">{order.retailerNote}</p>
                          </div>
                        )}

                        <div className="mt-6 space-y-3">
                          <label htmlFor={`reply-${order.id}`} className="block text-xs font-bold text-slate-400">رد المتجر على الطلب</label>
                          <textarea
                            id={`reply-${order.id}`}
                            rows={3}
                            value={replyMessages[order.id] || ""}
                            onChange={(event) => setReplyMessages((prev) => ({ ...prev, [order.id]: event.target.value }))}
                            className="w-full rounded-2xl border border-[#222d4a] bg-[#0b1221] text-slate-100 placeholder:text-slate-500 shadow-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 p-4 text-sm"
                            placeholder="اكتب ردًا أو ملاحظة للعميل هنا..."
                          />
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => handleReplySubmit(order.id)}
                              disabled={isReplySending}
                              className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              إرسال الرد
                            </button>
                            {order.sellerReply && (
                              <div className="rounded-2xl bg-slate-950/90 border border-[#222d4a] p-4 text-slate-300 text-sm">
                                <p className="text-xs text-slate-400 font-bold mb-2">آخر رد للبقالة</p>
                                <p>{order.sellerReply}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">كتالوج البضائع الخاص بمتجرك</h2>
              <button
                onClick={openAddModal}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة صنف جديد</span>
              </button>
            </div>

            {products.length === 0 ? (
              <div className="bg-[#151b2d] border border-[#222d4a] rounded-2xl py-16 text-center space-y-4">
                <Package className="w-12 h-12 text-[#222d4a] mx-auto" />
                <h3 className="font-bold text-slate-400">لا توجد منتجات مسجلة في المتجر</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">ابدأ بإضافة أول منتج لتتمكن البقالات من طلبه فوراً.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((prod) => (
                  <div key={prod.id} className="bg-[#151b2d] border border-[#222d4a] hover:border-[#354674] rounded-2xl overflow-hidden shadow-md flex flex-col justify-between transition-colors">
                    <div className="p-4 flex-1 space-y-3">
                      <div className="h-36 bg-[#0b0f19] border border-[#222d4a] rounded-xl flex items-center justify-center p-3 relative">
                        <Package className="w-12 h-12 text-slate-500" />
                        <span className="absolute top-2 right-2 bg-slate-800 text-[10px] text-slate-300 px-2 py-0.5 rounded font-bold border border-slate-700">
                          {prod.category?.name || "عام"}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-bold text-white text-sm line-clamp-2">{prod.name}</h3>
                        <p className="text-xs text-slate-400 line-clamp-1">{prod.description || "لا يوجد وصف"}</p>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-[#222d4a] text-xs font-semibold text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">السعر:</span>
                          <span className="font-bold text-amber-400">{prod.price.toLocaleString()} ر.ي / {prod.packingUnit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">المخزون الحالي:</span>
                          <span className={`font-bold ${prod.stock <= 0 ? "text-red-500" : "text-white"}`}>
                            {prod.stock} {prod.packingUnit}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">الحد الأدنى للطلب:</span>
                          <span>{prod.moq} {prod.packingUnit}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#1e253c]/30 border-t border-[#222d4a] p-3 flex gap-2">
                      <button
                        onClick={() => openEditModal(prod)}
                        className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(prod.id)}
                        className="p-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 rounded-lg transition-colors cursor-pointer"
                        title="حذف الصنف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="bg-[#151b2d] border border-[#222d4a] p-6 rounded-2xl shadow-lg space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">رسم بياني لتحليل المبيعات</h2>
              <p className="text-xs text-slate-400 mt-1">تطور مبيعات متجرك بناءً على آخر الطلبات الواردة المستلمة.</p>
            </div>

            {/* Custom SVG Line/Bar Chart (Simplicity First) */}
            <div className="flex justify-center py-6">
              <svg width="600" height="300" viewBox="0 0 600 300" className="w-full max-w-2xl bg-[#0b0f19] border border-[#222d4a] rounded-xl p-4">
                {/* Background grid lines */}
                <line x1="50" y1="50" x2="550" y2="50" stroke="#1d263b" strokeDasharray="4 4" />
                <line x1="50" y1="125" x2="550" y2="125" stroke="#1d263b" strokeDasharray="4 4" />
                <line x1="50" y1="200" x2="550" y2="200" stroke="#1d263b" strokeDasharray="4 4" />
                <line x1="50" y1="250" x2="550" y2="250" stroke="#222d4a" strokeWidth="2" />
                <line x1="50" y1="50" x2="50" y2="250" stroke="#222d4a" strokeWidth="2" />

                {/* Y Axis Labels */}
                <text x="40" y="55" fill="#64748b" fontSize="10" textAnchor="end">100K</text>
                <text x="40" y="130" fill="#64748b" fontSize="10" textAnchor="end">50K</text>
                <text x="40" y="205" fill="#64748b" fontSize="10" textAnchor="end">25K</text>
                <text x="40" y="255" fill="#64748b" fontSize="10" textAnchor="end">0</text>

                {/* Bar charts representing simulated month distribution */}
                <rect x="90" y="160" width="40" height="90" fill="#1e3a8a" rx="4" />
                <text x="110" y="270" fill="#94a3b8" fontSize="10" textAnchor="middle">يناير</text>

                <rect x="180" y="110" width="40" height="140" fill="#1e3a8a" rx="4" />
                <text x="200" y="270" fill="#94a3b8" fontSize="10" textAnchor="middle">فبراير</text>

                <rect x="270" y="190" width="40" height="60" fill="#1e3a8a" rx="4" />
                <text x="290" y="270" fill="#94a3b8" fontSize="10" textAnchor="middle">مارس</text>

                <rect x="360" y="80" width="40" height="170" fill="#3b82f6" rx="4" />
                <text x="380" y="270" fill="#94a3b8" fontSize="10" textAnchor="middle">أبريل</text>

                <rect x="450" y="100" width="40" height="150" fill="#d97706" rx="4" />
                <text x="470" y="270" fill="#94a3b8" fontSize="10" textAnchor="middle">مايو</text>
              </svg>
            </div>

            <div className="bg-[#1e253c]/50 p-4 rounded-xl border border-[#222d4a] text-xs font-semibold text-slate-300 leading-relaxed text-right">
              📈 يظهر المبيعات الشهرية نمواً بنسبة 25٪ مقارنة بالربع السابق. أعلى تصنيف مبيعات تم تسجيله في فئة <strong>المعلبات والأغذية</strong>.
            </div>
          </div>
        )}

      </main>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          {/* Backdrop */}
          <div onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-xs"></div>
          
          {/* Modal Container */}
          <div className="bg-[#151b2d] border border-[#222d4a] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl relative z-10">
            <div className="bg-[#1e253c]/50 px-6 py-4 border-b border-[#222d4a] flex items-center justify-between">
              <h3 className="font-extrabold text-white text-base">
                {editingProduct ? "تعديل تفاصيل الصنف" : "إضافة صنف جديد للمتجر"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-[#222d4a] rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">اسم الصنف بالكامل</label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  required
                  placeholder="مثال: علبة حليب مبخر ملوح - كرتون (48 حبة)"
                  className="w-full bg-[#0b0f19] border border-[#222d4a] rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">سعر الجملة (ر.ي)</label>
                  <input
                    type="number"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    required
                    placeholder="مثال: 12500"
                    className="w-full bg-[#0b0f19] border border-[#222d4a] rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">الرمز التعريفي للمنتج (SKU/رمز الشحنة)</label>
                  <input
                    type="text"
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    placeholder="مثال: YM-MILK-92"
                    className="w-full bg-[#0b0f19] border border-[#222d4a] rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500 text-left font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">المخزون المتوفر</label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    required
                    placeholder="مثال: 50"
                    className="w-full bg-[#0b0f19] border border-[#222d4a] rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">وحدة التغليف</label>
                  <input
                    type="text"
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    required
                    placeholder="كرتون / صندوق / كيس"
                    className="w-full bg-[#0b0f19] border border-[#222d4a] rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">الحد الأدنى للطلب</label>
                  <input
                    type="number"
                    value={prodMoq}
                    onChange={(e) => setProdMoq(e.target.value)}
                    required
                    min="1"
                    placeholder="1"
                    className="w-full bg-[#0b0f19] border border-[#222d4a] rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">قسم المنتج</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-[#222d4a] rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">تفاصيل ووصف المنتج</label>
                <textarea
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="اكتب وزناً، حجم العلبة، عدد الحبات بداخل الكرتونة ومميزات إضافية..."
                  rows={3}
                  className="w-full bg-[#0b0f19] border border-[#222d4a] rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition-colors cursor-pointer mt-4"
              >
                {editingProduct ? "حفظ وتعديل الصنف" : "إضافة الصنف فوراً للكتالوج"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
