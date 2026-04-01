import { Fragment, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  CheckCircle2,
  Clock3,
  LoaderCircle,
  PackageCheck,
  RotateCcw,
  Truck,
} from "lucide-react";
import ComponentCard from "../../components/admin_component/common/ComponentCard";
import PageBreadcrumb from "../../components/admin_component/common/PageBreadCrumb";
import PageMeta from "../../components/admin_component/common/PageMeta";
import type { OrderRecord } from "../../types/shop";
import { apiUrl, formatCurrency } from "../../utils/shop";

const ORDER_STATUS_OPTIONS: Array<OrderRecord["orderStatus"]> = [
  "pending",
  "confirmed",
  "shipping",
  "completed",
  "cancelled",
];

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

export default function OrderManagement() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const accessToken = localStorage.getItem("access_token");

  const showMessage = (value: string) => {
    setMessage(value);
    window.setTimeout(() => setMessage(""), 2500);
  };

  const fetchOrders = async () => {
    if (!accessToken) {
      setError("Ban can dang nhap admin de xem don hang.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${apiUrl}/api/order/get-all`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.data?.status !== "OK") {
        setError(response.data?.message ?? "Khong the tai danh sach don hang.");
        return;
      }

      setOrders(response.data?.data ?? []);
    } catch (err) {
      console.error(err);
      setError("Khong the tai danh sach don hang.");
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

  const handleStatusChange = async (
    orderId: string,
    orderStatus: OrderRecord["orderStatus"],
  ) => {
    if (!accessToken) {
      return;
    }

    try {
      setUpdatingOrderId(orderId);
      const response = await axios.patch(
        `${apiUrl}/api/order/update-status/${orderId}`,
        { orderStatus },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.data?.status !== "OK") {
        setError(response.data?.message ?? "Khong the cap nhat trang thai.");
        return;
      }

      const updatedOrder: OrderRecord = response.data.data;
      setOrders((prev) =>
        prev.map((order) => (order._id === orderId ? updatedOrder : order)),
      );
      showMessage("Da cap nhat trang thai don hang.");
    } catch (err) {
      console.error(err);
      setError("Khong the cap nhat trang thai don hang.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <>
      <PageMeta
        title="Quản lý đơn hàng | Mini64 Hobby Store"
        description="Trang quản trị đơn hàng"
      />
      <PageBreadcrumb pageTitle="Quản lý đơn hàng" />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
              <PackageCheck size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tong don hang</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <Clock3 size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Cho xac nhan</p>
              <p className="text-xl font-bold">{stats.pending}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Truck size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Dang giao</p>
              <p className="text-xl font-bold">{stats.shipping}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Hoan tat</p>
              <p className="text-xl font-bold">{stats.completed}</p>
            </div>
          </div>
        </div>

        <ComponentCard
          title="Danh sách đơn hàng"
          desc="Theo dõi người mua, sản phẩm và cập nhật trạng thái giao hàng."
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">
                  Admin co the doi trang thai don truc tiep ngay tren bang duoi day.
                </p>
              </div>
              <button
                onClick={fetchOrders}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50"
              >
                <RotateCcw size={16} className={loading ? "animate-spin" : ""} />
                Lam moi
              </button>
            </div>

            {message && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            {loading ? (
              <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-16 text-center text-sm text-gray-500">
                Dang tai du lieu don hang...
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-16 text-center text-sm text-gray-500">
                Chua co don hang nao trong he thong.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr className="text-left text-sm text-gray-500">
                        <th className="px-4 py-4 font-semibold">Khach hang</th>
                        <th className="px-4 py-4 font-semibold">Don hang</th>
                        <th className="px-4 py-4 font-semibold">Tong tien</th>
                        <th className="px-4 py-4 font-semibold">Thanh toan</th>
                        <th className="px-4 py-4 font-semibold">Trang thai</th>
                        <th className="px-4 py-4 font-semibold text-right">
                          Chi tiet
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {orders.map((order) => (
                        <Fragment key={order._id}>
                          <tr className="align-top">
                            <td className="px-4 py-4">
                              <div className="font-semibold text-gray-900">
                                {order.shippingAddress.fullName}
                              </div>
                              <div className="mt-1 text-sm text-gray-500">
                                {order.user?.email ?? "Khach vang lai"}
                              </div>
                              <div className="mt-1 text-sm text-gray-500">
                                {order.shippingAddress.phone}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="font-semibold text-gray-900">
                                #{order._id.slice(-8).toUpperCase()}
                              </div>
                              <div className="mt-1 text-sm text-gray-500">
                                {new Date(order.createdAt).toLocaleString("vi-VN")}
                              </div>
                              <div className="mt-1 text-sm text-gray-500">
                                {order.items.length} san pham
                              </div>
                            </td>
                            <td className="px-4 py-4 font-semibold text-gray-900">
                              {formatCurrency(order.totalPrice)}
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-purple-600">
                                {order.paymentMethod}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col gap-2">
                                <span
                                  className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClassMap[order.orderStatus]}`}
                                >
                                  {statusLabelMap[order.orderStatus]}
                                </span>
                                <select
                                  value={order.orderStatus}
                                  onChange={(event) =>
                                    handleStatusChange(
                                      order._id,
                                      event.target.value as OrderRecord["orderStatus"],
                                    )
                                  }
                                  disabled={updatingOrderId === order._id}
                                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {ORDER_STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status}>
                                      {statusLabelMap[status]}
                                    </option>
                                  ))}
                                </select>
                                {updatingOrderId === order._id && (
                                  <div className="inline-flex items-center gap-2 text-xs text-indigo-600">
                                    <LoaderCircle size={14} className="animate-spin" />
                                    Dang cap nhat
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <button
                                onClick={() =>
                                  setExpandedOrderId((prev) =>
                                    prev === order._id ? null : order._id,
                                  )
                                }
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-indigo-400 hover:text-indigo-600"
                              >
                                {expandedOrderId === order._id ? "Thu gon" : "Xem"}
                              </button>
                            </td>
                          </tr>

                          {expandedOrderId === order._id && (
                            <tr className="bg-gray-50/60">
                              <td colSpan={6} className="px-4 py-5">
                                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                                    <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">
                                      San pham trong don
                                    </h4>
                                    <div className="mt-4 space-y-4">
                                      {order.items.map((item, index) => (
                                        <div
                                          key={`${order._id}-${item.name}-${index}`}
                                          className="flex items-center gap-4 rounded-2xl border border-gray-100 p-4"
                                        >
                                          <img
                                            src={item.image}
                                            alt={item.name}
                                            className="h-16 w-16 rounded-xl object-cover"
                                          />
                                          <div className="min-w-0 flex-1">
                                            <p className="truncate font-semibold text-gray-900">
                                              {item.name}
                                            </p>
                                            <p className="mt-1 text-sm text-gray-500">
                                              {item.quantity} x {formatCurrency(item.price)}
                                            </p>
                                          </div>
                                          <p className="font-semibold text-gray-900">
                                            {formatCurrency(item.price * item.quantity)}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                                      <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">
                                        Giao hang
                                      </h4>
                                      <div className="mt-4 space-y-2 text-sm text-gray-600">
                                        <p>
                                          <span className="font-semibold text-gray-900">
                                            Nguoi nhan:
                                          </span>{" "}
                                          {order.shippingAddress.fullName}
                                        </p>
                                        <p>
                                          <span className="font-semibold text-gray-900">
                                            So dien thoai:
                                          </span>{" "}
                                          {order.shippingAddress.phone}
                                        </p>
                                        <p>
                                          <span className="font-semibold text-gray-900">
                                            Dia chi:
                                          </span>{" "}
                                          {order.shippingAddress.address}
                                        </p>
                                        <p>
                                          <span className="font-semibold text-gray-900">
                                            Ghi chu:
                                          </span>{" "}
                                          {order.shippingAddress.note || "Khong co"}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                                      <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">
                                        Tong ket
                                      </h4>
                                      <div className="mt-4 space-y-3 text-sm text-gray-600">
                                        <div className="flex items-center justify-between">
                                          <span>Tam tinh</span>
                                          <span>{formatCurrency(order.subtotal)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span>Van chuyen</span>
                                          <span>{formatCurrency(order.shippingFee)}</span>
                                        </div>
                                        <div className="flex items-center justify-between font-semibold text-gray-900">
                                          <span>Tong cong</span>
                                          <span>{formatCurrency(order.totalPrice)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
