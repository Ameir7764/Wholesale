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
  DollarSign,
  ArrowUpRight,
  Shield,
  Store as StoreIcon
} from "@/components/Icons";
import { deauthenticateUser, addProduct, editProduct, removeProduct, changeOrderStatus } from "@/app/actions";
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
  stats,
}: WholesalerClientProps) {
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "erp">("products");
  const [orderFilter, setOrderFilter] = useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { showToast } = useToast();

  // New Product Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    price: "",
    moq: "1",
    packingUnit: "كرتون",
    stock: "100",
    imageUrl: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("حجم الصورة يجب أن لا يتجاوز 5 ميجابايت.", "warning");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addProduct({
        name: formData.name,
        description: formData.description,
        sku: formData.sku,
        price: parseFloat(formData.price),
        moq: parseInt(formData.moq, 10),
        packingUnit: formData.packingUnit,
        stock: parseInt(formData.stock, 10),
        imageUrl: formData.imageUrl || null,
      });
      setIsAddModalOpen(false);
      setFormData({ name: "", description: "", sku: "", price: "", moq: "1", packingUnit: "كرتون", stock: "100", imageUrl: "" });
      showToast("تمت إضافة المنتج بنجاح إلى متجرك.", "success");
    } catch (err: any) {
      showToast(err.message || "حدث خطأ أثناء إضافة المنتج.", "error");
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await editProduct(editingProduct.id, {
        name: formData.name,
        description: formData.description,
        sku: formData.sku,
        price: parseFloat(formData.price),
        moq: parseInt(formData.moq, 10),
        packingUnit: formData.packingUnit,
        stock: parseInt(formData.stock, 10),
        imageUrl: formData.imageUrl || null,
      });
      setEditingProduct(null);
      showToast("تم تحديث بيانات المنتج بنجاح.", "success");
    } catch (err: any) {
      showToast(err.message || "حدث خطأ أثناء تعديل المنتج.", "error");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("هل أنت تأكد من رغبتك في حذف هذا المنتج من متجرك؟")) return;
    try {
      await removeProduct(id);
      showToast("تم حذف المنتج بنجاح.", "success");
    } catch (err: any) {
      showToast(err.message || "حدث خطأ أثناء حذف المنتج.", "error");
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setLoadingId(orderId);
    try {
      await changeOrderStatus(orderId, newStatus);
      showToast("تم تحديث حالة الطلب بنجاح.", "success");
    } catch (err: any) {
      showToast(err.message || "حدث خطأ أثناء تحديث حالة الطلب.", "error");
    } finally {
      setLoadingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === "ALL") return true;
    return o.status === orderFilter;
  });

  return (
    <div className="flex flex-col min-h-screen text-slate-100 bg-[#070a12] font-sans selection:bg-blue-500 selection:text-slate-950" lang="ar" dir="rtl">
      
      {/* Background Orbs */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Glass Top Header */}
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 px-4 md:px-8 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/20 font-black">
            <StoreIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white">{store.name}</h1>
              {store.isVerified ? (
                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> متجر معتمد
                </span>
              ) : (
                <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  قيد المراجعة
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">لوحة تحكم وإدارة موزع الجملة</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse min-w-0 w-full md:w-auto overflow-x-auto hide-scrollbar">
          {/* Tabs */}
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 shrink-0">
            <button 
              onClick={() => setActiveTab("products")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "products" 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>إدارة المنتجات ({products.length})</span>
            </button>
            <button 
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "orders" 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>الطلبات الواردة ({orders.length})</span>
            </button>
            <button 
              onClick={() => setActiveTab("erp")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "erp" 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>مزامنة الـ ERP</span>
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
        
        {/* Analytics KPI Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs text-slate-400 font-semibold">إجمالي المبيعات</span>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-black text-emerald-400">{stats.totalRevenue.toLocaleString()} ر.ي</h3>
            <p className="text-[10px] text-slate-500 mt-1">المبيعات المحصلة والمكتملة</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs text-slate-400 font-semibold">الطلبات النشطة</span>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-black text-blue-400">{stats.activeOrdersCount} طلبات</h3>
            <p className="text-[10px] text-slate-500 mt-1">بانتظار التحضير والشحن</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs text-slate-400 font-semibold">المنتجات النشطة</span>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-black text-amber-400">{stats.totalProductsCount} صنف</h3>
            <p className="text-[10px] text-slate-500 mt-1">معروضة في سوق التجزئة</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs text-slate-400 font-semibold">منخفض المخزون</span>
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-black text-red-400">{stats.outOfStockCount} أصناف</h3>
            <p className="text-[10px] text-slate-500 mt-1">تحتاج إلى إعادة تزويد</p>
          </div>
        </div>

        {/* Tab 1: Products List */}
        {activeTab === "products" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-white">إدارة قائمة منتجات المتجر</h2>
                <p className="text-xs text-slate-400 mt-1">أضف المنتجات، حدد أسعار الجملة، وحدد وحدات التغليف والـ MOQ</p>
              </div>
              <button
                onClick={() => {
                  setFormData({ name: "", description: "", sku: "", price: "", moq: "1", packingUnit: "كرتون", stock: "100", imageUrl: "" });
                  setIsAddModalOpen(true);
                }}
                className="btn-amber px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة منتج جديد</span>
              </button>
            </div>

            {products.length === 0 ? (
              <div className="glass-panel rounded-3xl p-16 text-center space-y-4 border border-slate-800">
                <Package className="w-12 h-12 text-slate-600 mx-auto" />
                <div>
                  <h3 className="text-base font-bold text-slate-300">لا توجد منتجات مسجلة بمتجرك حتى الآن</h3>
                  <p className="text-xs text-slate-500 mt-1">اضغط على زر إضافة منتج جديد لبدء العرض للبقالات.</p>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map((product) => (
                  <div key={product.id} className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                          SKU: {product.sku || "غير محدد"}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${product.stock > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                          {product.stock > 0 ? `المتوفر: ${product.stock}` : "منتهي"}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-100 text-sm">{product.name}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{product.description || "لا يوجد وصف إضافي."}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 space-y-3">
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="text-slate-400">السعر:</span>
                        <span className="text-base font-black text-amber-400">{product.price.toLocaleString()} ر.ي / {product.packingUnit}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400 bg-slate-900/60 p-2 rounded-xl">
                        <span>الحد الأدنى (MOQ): <strong className="text-slate-200">{product.moq}</strong></span>
                        <span>الوحدة: <strong className="text-slate-200">{product.packingUnit}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setFormData({
                              name: product.name,
                              description: product.description || "",
                              sku: product.sku || "",
                              price: product.price.toString(),
                              moq: product.moq.toString(),
                              packingUnit: product.packingUnit,
                              stock: product.stock.toString(),
                              imageUrl: product.imageUrl || "",
                            });
                          }}
                          className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5 text-blue-400" />
                          <span>تعديل</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800 rounded-xl cursor-pointer transition-colors"
                          title="حذف المنتج"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Orders List */}
        {activeTab === "orders" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-white">إدارة الطلبات الواردة للمتجر</h2>
                <p className="text-xs text-slate-400 mt-1">راجع طلبات أصحاب البقالات وحدث حالات الشحن والتنفيذ</p>
              </div>

              {/* Status Filter */}
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold overflow-x-auto hide-scrollbar">
                {["ALL", "PENDING", "ACCEPTED", "PREPARING", "SHIPPED", "DELIVERED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderFilter(st)}
                    className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      orderFilter === st ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {st === "ALL" && "الكل"}
                    {st === "PENDING" && "معلق"}
                    {st === "ACCEPTED" && "مقبول"}
                    {st === "PREPARING" && "تحضير"}
                    {st === "SHIPPED" && "مشحون"}
                    {st === "DELIVERED" && "مستلم"}
                  </button>
                ))}
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="glass-panel rounded-3xl p-16 text-center space-y-4 border border-slate-800">
                <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">لا توجد طلبات مطابقة للفيلتر الحالي.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="glass-card rounded-2xl overflow-hidden border border-slate-800">
                    <div className="bg-slate-900/80 px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">العميل (البقالة)</p>
                        <p className="text-xs font-bold text-white">{order.retailer.name}</p>
                      </div>

                      <div>
                        <p className="text-[10px] text-slate-400 font-bold">رقم الطلب</p>
                        <p className="text-xs font-mono font-bold text-amber-400">#{order.id.slice(0, 8).toUpperCase()}</p>
                      </div>

                      <div>
                        <p className="text-[10px] text-slate-400 font-bold">المبلغ الإجمالي</p>
                        <p className="text-xs font-black text-emerald-400">{order.total.toLocaleString()} ر.ي</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold mb-1">حالة الطلب الحالية</p>
                          <select
                            value={order.status}
                            disabled={loadingId === order.id}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                          >
                            <option value="PENDING">🟡 بانتظار القبول</option>
                            <option value="ACCEPTED">🟢 تم قبول الطلب</option>
                            <option value="PREPARING">🟣 قيد التحضير</option>
                            <option value="SHIPPED">🚚 تم الشحن للتوصيل</option>
                            <option value="DELIVERED">✅ تم التسليم بنجاح</option>
                            <option value="CANCELLED">❌ إلغاء الطلب</option>
                          </select>
                        </div>
                        <button
                          onClick={() => setSelectedInvoiceOrder(order)}
                          className="mt-4 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>الفاتورة الضريبية</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-6">
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-bold pb-2">
                            <th className="pb-2">الصنف</th>
                            <th className="pb-2 text-center">الكمية</th>
                            <th className="pb-2 text-left">السعر</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {order.items.map((item) => (
                            <tr key={item.id} className="text-slate-200">
                              <td className="py-3 font-semibold">{item.product.name}</td>
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

        {/* Tab 3: ERP Sync Webhook */}
        {activeTab === "erp" && (
          <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6 max-w-3xl mx-auto animate-fade-in">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">واجهة ربط الـ ERP والتزامن التلقائي</h2>
                <p className="text-xs text-slate-400">ربط مخزون متجرك مباشرة مع يمن سوفت، أودو، أو أي نظام محاسبي</p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">مسار الـ Webhook المعتمد:</span>
                <p className="font-mono text-blue-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800 select-all">
                  POST /api/wholesaler/sync-inventory
                </p>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">رمز المتجر الخاص بك (Store ID):</span>
                <p className="font-mono text-amber-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800 select-all">
                  {store.id}
                </p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Add / Edit Product Modal */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" dir="rtl" lang="ar">
          <div className="w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">
                {editingProduct ? "تعديل بيانات المنتج" : "إضافة منتج جديد للمتجر"}
              </h3>
              <button 
                onClick={() => { setIsAddModalOpen(false); setEditingProduct(null); }} 
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingProduct ? handleEditProduct : handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">اسم المنتج</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="مثال: حليب ممتاز 1 لتر"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">السعر بالجملة (ر.ي)</label>
                  <input
                    name="price"
                    type="number"
                    required
                    placeholder="25000"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">رمز الـ SKU</label>
                  <input
                    name="sku"
                    type="text"
                    placeholder="RAW-MILK-01"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">الحد الأدنى (MOQ)</label>
                  <input
                    name="moq"
                    type="number"
                    required
                    value={formData.moq}
                    onChange={handleInputChange}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">وحدة التغليف</label>
                  <input
                    name="packingUnit"
                    type="text"
                    required
                    value={formData.packingUnit}
                    onChange={handleInputChange}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">كمية المخزون</label>
                  <input
                    name="stock"
                    type="number"
                    required
                    value={formData.stock}
                    onChange={handleInputChange}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">صورة المنتج (رابط أو رفع من الجهاز)</label>
                <div className="space-y-2">
                  <input
                    name="imageUrl"
                    type="url"
                    placeholder="https://example.com/product.jpg"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-sm font-mono text-xs"
                  />
                  <div className="flex items-center gap-3">
                    <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition border border-slate-700">
                      <span>📁 اختر صورة من الجهاز</span>
                      <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                    </label>
                    {formData.imageUrl && (
                      <span className="text-[11px] text-emerald-400 font-bold">✓ تم اختيار الصورة</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 btn-amber rounded-xl text-slate-950 font-bold text-xs cursor-pointer mt-4"
              >
                {editingProduct ? "حفظ التعديلات" : "إضافة المنتج الآن"}
              </button>
            </form>
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
