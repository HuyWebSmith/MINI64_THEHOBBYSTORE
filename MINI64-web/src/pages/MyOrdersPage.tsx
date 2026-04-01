import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CheckCircle2, Clock3, Package, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import type { OrderRecord } from "../types/shop";
import { apiUrl, formatCurrency, getAuthHeaders } from "../utils/shop";

const statusLabelMap: Record<OrderRecord["orderStatus"], string> = {
  pending: "Cho xac nhan",
  confirmed: "Da xac nhan",
  shipping: "Dang giao",
  completed: "Hoan tat",
  cancelled: "Da huy",
};

const statusClassMap: Record<OrderRecord["orderStatus"], string> = {
  pending: "bg-amber-50 text-amber-600",
  confirmed: "bg-blue-50 text-blue-600",
  shipping: "bg-indigo-50 text-indigo-600",
  completed: "bg-emerald-50 text-emerald-600",
  cancelled: "bg-rose-50 text-rose-600",
};

const MyOrdersPage = () => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    const headers = getAuthHeaders();

    if (!headers) {
      setLoading(false);
      setOrders([]);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${apiUrl}/api/order/my-orders`, {
        headers,
      });

      if (response.data?.status !== "OK") {
        setError(response.data?.message ?? "Khong the tai lich su don hang.");
        return;
      }

      setOrders(response.data?.data ?? []);
    } catch (err) {
      console.error(err);
      setError("Khong the tai lich su don hang.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((order) => order.orderStatus === "pending").length,
      shipping: orders.filter((order) => order.orderStatus === "shipping").length,
      completed: orders.filter((order) => order.orderStatus === "completed").length,
    }),
    [orders],
  );

  return (
    <section className="min-h-screen bg-slate-100 px-5 pb-20 pt-32 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-purple-500">
              Orders
            </p>
            <h1 className="mt-3 text-4xl font-black text-slate-900">
              Don hang cua toi
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Theo doi lai cac don da dat, trang thai giao hang va tong thanh toan.
            </p>
          </div>
          <Link
            to="/cart"
            className="rounded-full border border-purple-500 px-6 py-3 font-semibold text-purple-600 transition hover:bg-purple-500 hover:text-white"
          >
            Mo gio hang
          </Link>
        </div>

        {!getAuthHeaders() ? (
          <div className="mt-10 rounded-[32px] bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">
              Hay dang nhap de xem don hang cua ban
            </h2>
            <p className="mt-3 text-slate-600">
              Sau khi dang nhap, ban se xem duoc lich su dat hang va trang thai moi nhat.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex rounded-full bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700"
            >
              Dang nhap
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="flex items-center gap-4 rounded-[28px] bg-white p-5 shadow-sm">
                <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                  <Package size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Tong don hang</p>
                  <p className="text-xl font-black text-slate-900">{stats.total}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-[28px] bg-white p-5 shadow-sm">
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                  <Clock3 size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Cho xac nhan</p>
                  <p className="text-xl font-black text-slate-900">{stats.pending}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-[28px] bg-white p-5 shadow-sm">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                  <Truck size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Dang giao</p>
                  <p className="text-xl font-black text-slate-900">{stats.shipping}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-[28px] bg-white p-5 shadow-sm">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Hoan tat</p>
                  <p className="text-xl font-black text-slate-900">{stats.completed}</p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="mt-10 rounded-[32px] bg-white p-10 text-center text-slate-500 shadow-sm">
                Dang tai lich su don hang...
              </div>
            ) : error ? (
              <div className="mt-10 rounded-[32px] border border-red-200 bg-red-50 p-10 text-center text-red-600">
                {error}
              </div>
            ) : orders.length === 0 ? (
              <div className="mt-10 rounded-[32px] bg-white p-10 text-center shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900">
                  Ban chua co don hang nao
                </h2>
                <p className="mt-3 text-slate-600">
                  Kham pha san pham va dat don dau tien ngay tren website.
                </p>
                <Link
                  to="/"
                  className="mt-6 inline-flex rounded-full bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700"
                >
                  Mua sam ngay
                </Link>
              </div>
            ) : (
              <div className="mt-10 space-y-6">
                {orders.map((order) => (
                  <article
                    key={order._id}
                    className="rounded-[32px] bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Don hang #{order._id.slice(-8).toUpperCase()}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          Dat luc {new Date(order.createdAt).toLocaleString("vi-VN")}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${statusClassMap[order.orderStatus]}`}
                        >
                          {statusLabelMap[order.orderStatus]}
                        </span>
                        <span className="rounded-full bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-600">
                          {order.paymentMethod}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                      <div className="space-y-4">
                        {order.items.map((item, index) => (
                          <div
                            key={`${order._id}-${item.name}-${index}`}
                            className="flex items-center gap-4 rounded-[24px] border border-slate-100 p-4"
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-20 w-20 rounded-2xl object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-slate-900">
                                {item.name}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {item.quantity} x {formatCurrency(item.price)}
                              </p>
                            </div>
                            <p className="font-semibold text-slate-900">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-[24px] bg-slate-50 p-5">
                          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
                            Giao hang
                          </h3>
                          <div className="mt-4 space-y-2 text-sm text-slate-600">
                            <p>
                              <span className="font-semibold text-slate-900">
                                Nguoi nhan:
                              </span>{" "}
                              {order.shippingAddress.fullName}
                            </p>
                            <p>
                              <span className="font-semibold text-slate-900">
                                So dien thoai:
                              </span>{" "}
                              {order.shippingAddress.phone}
                            </p>
                            <p>
                              <span className="font-semibold text-slate-900">
                                Dia chi:
                              </span>{" "}
                              {order.shippingAddress.address}
                            </p>
                            <p>
                              <span className="font-semibold text-slate-900">
                                Ghi chu:
                              </span>{" "}
                              {order.shippingAddress.note || "Khong co"}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-[24px] bg-slate-900 p-5 text-white">
                          <div className="flex items-center justify-between text-sm text-white/70">
                            <span>Tam tinh</span>
                            <span>{formatCurrency(order.subtotal)}</span>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-sm text-white/70">
                            <span>Van chuyen</span>
                            <span>{formatCurrency(order.shippingFee)}</span>
                          </div>
                          <div className="mt-4 flex items-center justify-between text-lg font-bold">
                            <span>Tong cong</span>
                            <span>{formatCurrency(order.totalPrice)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default MyOrdersPage;
