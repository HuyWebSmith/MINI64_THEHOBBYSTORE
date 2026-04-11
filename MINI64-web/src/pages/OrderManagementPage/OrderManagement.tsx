import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { ChevronDown, Loader2, RefreshCcw, Truck } from "lucide-react";
import PageBreadcrumb from "../../components/admin_component/common/PageBreadCrumb";
import ComponentCard from "../../components/admin_component/common/ComponentCard";
import PageMeta from "../../components/admin_component/common/PageMeta";

const apiUrl = import.meta.env.VITE_API_URL;

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PACKING"
  | "SHIPPING"
  | "DELIVERED"
  | "CANCELLED";

type OrderRow = {
  _id: string;
  createdAt: string;
  totalPrice: number;
  status: OrderStatus;
  trackingCode?: string;
  carrierName?: string;
  shippingAddress?: {
    fullName?: string;
  };
};

const ADMIN_ORDER_EVENTS = {
  CREATED: "ADMIN_ORDER_CREATED",
  UPDATED: "ADMIN_ORDER_UPDATED",
};

type FilterTab = {
  label: string;
  value: "ALL" | OrderStatus;
};

const filterTabs: FilterTab[] = [
  { label: "Tất cả", value: "ALL" },
  { label: "Chờ xử lý", value: "PENDING" },
  { label: "Đang giao", value: "SHIPPING" },
  { label: "Đã hoàn thành", value: "DELIVERED" },
];

const quickStatuses: { label: string; value: OrderStatus }[] = [
  { label: "Chờ xác nhận", value: "PENDING" },
  { label: "Đã xác nhận", value: "CONFIRMED" },
  { label: "Đang đóng gói", value: "PACKING" },
  { label: "Đang giao hàng", value: "SHIPPING" },
  { label: "Đã giao", value: "DELIVERED" },
  { label: "Đã hủy", value: "CANCELLED" },
];

function formatCurrency(price: number) {
  return `${price.toLocaleString("vi-VN")}đ`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getBadgeStyles(status: OrderStatus) {
  switch (status) {
    case "SHIPPING":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-400/20";
    case "DELIVERED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-400/20";
    case "PENDING":
    case "CONFIRMED":
    case "PACKING":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-400/20";
    default:
      return "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-400/20";
  }
}

function getStatusLabel(status: OrderStatus) {
  switch (status) {
    case "PENDING":
      return "Chờ xác nhận";
    case "CONFIRMED":
      return "Đã xác nhận";
    case "PACKING":
      return "Đang đóng gói";
    case "SHIPPING":
      return "Đang giao";
    case "DELIVERED":
      return "Hoàn thành";
    default:
      return "Đã hủy";
  }
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab["value"]>("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<Record<string, OrderStatus>>({});
  const [shippingDraft, setShippingDraft] = useState<
    Record<string, { trackingCode: string; carrierName: string }>
  >({});
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("CONFIRMED");
  const [bulkShippingDraft, setBulkShippingDraft] = useState({
    trackingCode: "",
    carrierName: "",
  });
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const accessToken = localStorage.getItem("access_token");

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const socket = io(apiUrl, {
      auth: { token: `Bearer ${accessToken}` },
      transports: ["websocket"],
    });

    socket.on(ADMIN_ORDER_EVENTS.CREATED, (order: OrderRow) => {
      if (!order?._id) {
        return;
      }

      setOrders((current) => {
        if (current.some((item) => item._id === order._id)) {
          return current;
        }

        return [order, ...current];
      });

      setDraftStatus((current) =>
        current[order._id] ? current : { ...current, [order._id]: order.status },
      );

      setShippingDraft((current) =>
        current[order._id]
          ? current
          : {
              ...current,
              [order._id]: {
                trackingCode: order.trackingCode ?? "",
                carrierName: order.carrierName ?? "",
              },
            },
      );
    });

    socket.on(ADMIN_ORDER_EVENTS.UPDATED, (order: OrderRow) => {
      if (!order?._id) {
        return;
      }

      setOrders((current) =>
        current.map((item) => (item._id === order._id ? { ...item, ...order } : item)),
      );

      setDraftStatus((current) => ({ ...current, [order._id]: order.status }));

      setShippingDraft((current) => ({
        ...current,
        [order._id]: {
          trackingCode: order.trackingCode ?? current[order._id]?.trackingCode ?? "",
          carrierName: order.carrierName ?? current[order._id]?.carrierName ?? "",
        },
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken]);

  const fetchOrders = async () => {
    if (!accessToken) {
      setError("Bạn cần đăng nhập quyền admin để xem đơn hàng.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${apiUrl}/api/orders`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const nextOrders: OrderRow[] = response.data?.data ?? [];
      setOrders(nextOrders);

      setDraftStatus(
        nextOrders.reduce<Record<string, OrderStatus>>((acc, order) => {
          acc[order._id] = order.status;
          return acc;
        }, {}),
      );

      setShippingDraft(
        nextOrders.reduce<Record<string, { trackingCode: string; carrierName: string }>>(
          (acc, order) => {
            acc[order._id] = {
              trackingCode: order.trackingCode ?? "",
              carrierName: order.carrierName ?? "",
            };
            return acc;
          },
          {},
        ),
      );
      setSelectedOrderIds((current) =>
        current.filter((orderId) =>
          nextOrders.some((order) => order._id === orderId),
        ),
      );
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách đơn hàng từ máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrders();
  }, [activeFilter]);

  const statusSummary = useMemo(
    () => ({
      total: orders.length,
      shipping: orders.filter((order) => order.status === "SHIPPING").length,
      done: orders.filter((order) => order.status === "DELIVERED").length,
    }),
    [orders],
  );

  const displayedOrders = useMemo(() => {
    if (activeFilter === "ALL") {
      return orders;
    }

    if (activeFilter === "PENDING") {
      return orders.filter((order) =>
        ["PENDING", "CONFIRMED", "PACKING"].includes(order.status),
      );
    }

    return orders.filter((order) => order.status === activeFilter);
  }, [activeFilter, orders]);

  useEffect(() => {
    setSelectedOrderIds((current) =>
      current.filter((orderId) =>
        displayedOrders.some((order) => order._id === orderId),
      ),
    );
  }, [displayedOrders]);

  const isAllDisplayedSelected =
    displayedOrders.length > 0 &&
    displayedOrders.every((order) => selectedOrderIds.includes(order._id));

  const handleQuickUpdate = async (orderId: string) => {
    if (!accessToken) {
      setError("Bạn cần đăng nhập quyền admin để cập nhật đơn hàng.");
      return;
    }

    const status = draftStatus[orderId];
    if (!status) {
      return;
    }

    try {
      setUpdatingId(orderId);
      setError("");
      setSuccessMessage("");

      const payload: {
        status: OrderStatus;
        note: string;
        trackingCode?: string;
        carrierName?: string;
      } = {
        status,
        note: `Admin chuyển trạng thái sang ${getStatusLabel(status)}.`,
      };

      if (status === "SHIPPING") {
        payload.trackingCode = shippingDraft[orderId]?.trackingCode ?? "";
        payload.carrierName = shippingDraft[orderId]?.carrierName ?? "";
      }

      const response = await axios.put(
        `${apiUrl}/api/orders/update-status/${orderId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.data?.status !== "OK") {
        throw new Error(response.data?.message || "Cập nhật thất bại");
      }

      setOrders((current) =>
        current.map((order) =>
          order._id === orderId
            ? {
                ...order,
                status,
                trackingCode: payload.trackingCode ?? order.trackingCode,
                carrierName: payload.carrierName ?? order.carrierName,
              }
            : order,
        ),
      );
      setSuccessMessage("Đã cập nhật trạng thái đơn hàng.");
      setOpenDropdownId(null);
    } catch (err) {
      console.error(err);
      setError("Không thể cập nhật trạng thái đơn hàng.");
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleSelectedOrder = (orderId: string) => {
    setSelectedOrderIds((current) =>
      current.includes(orderId)
        ? current.filter((id) => id !== orderId)
        : [...current, orderId],
    );
  };

  const toggleSelectAllDisplayed = () => {
    if (isAllDisplayedSelected) {
      setSelectedOrderIds([]);
      return;
    }

    setSelectedOrderIds(displayedOrders.map((order) => order._id));
  };

  const handleBulkUpdate = async () => {
    if (!accessToken || selectedOrderIds.length === 0) {
      return;
    }

    try {
      setBulkUpdating(true);
      setError("");
      setSuccessMessage("");

      const payload: {
        orderIds: string[];
        status: OrderStatus;
        note: string;
        trackingCode?: string;
        carrierName?: string;
      } = {
        orderIds: selectedOrderIds,
        status: bulkStatus,
        note: `Admin chuyển hàng loạt sang ${getStatusLabel(bulkStatus)}.`,
      };

      if (bulkStatus === "SHIPPING") {
        payload.trackingCode = bulkShippingDraft.trackingCode;
        payload.carrierName = bulkShippingDraft.carrierName;
      }

      const response = await axios.put(
        `${apiUrl}/api/orders/update-status-bulk`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.data?.status !== "OK") {
        throw new Error(response.data?.message || "Bulk update failed");
      }

      const updatedOrders: OrderRow[] = response.data?.data?.updatedOrders ?? [];
      const updatedMap = new Map(updatedOrders.map((order) => [order._id, order]));

      setOrders((current) =>
        current.map((order) => updatedMap.get(order._id) ?? order),
      );
      setSelectedOrderIds([]);
      setBulkShippingDraft({ trackingCode: "", carrierName: "" });

      const failedCount = response.data?.data?.failedOrderIds?.length ?? 0;
      setSuccessMessage(
        failedCount > 0
          ? `Đã cập nhật ${updatedOrders.length} đơn. ${failedCount} đơn không thể cập nhật.`
          : `Đã cập nhật ${updatedOrders.length} đơn hàng đã chọn.`,
      );
    } catch (err) {
      console.error(err);
      setError("Không thể cập nhật hàng loạt cho các đơn đã chọn.");
    } finally {
      setBulkUpdating(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Quản lý đơn hàng | Mini64 Hobby Store"
        description="Trang quản lý đơn hàng admin"
      />
      <PageBreadcrumb pageTitle="Quản lý đơn hàng" />

      <div className="space-y-6">
        <ComponentCard
          title="Admin Order List"
          desc="Lọc nhanh đơn hàng theo trạng thái và cập nhật tiến trình giao hàng ngay tại bảng."
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveFilter(tab.value)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      activeFilter === tab.value
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => void fetchOrders()}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-indigo-200 hover:text-indigo-600 dark:border-gray-700 dark:text-gray-300"
              >
                <RefreshCcw className="h-4 w-4" />
                Làm mới
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/70">
                <p className="text-sm text-gray-500 dark:text-gray-400">Tổng đơn</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {statusSummary.total}
                </p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-400/20 dark:bg-blue-500/10">
                <p className="text-sm text-blue-700 dark:text-blue-300">Đang giao</p>
                <p className="mt-2 text-2xl font-bold text-blue-700 dark:text-blue-200">
                  {statusSummary.shipping}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-400/20 dark:bg-emerald-500/10">
                <p className="text-sm text-emerald-700 dark:text-emerald-300">Hoàn thành</p>
                <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-200">
                  {statusSummary.done}
                </p>
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </div>
            ) : null}

            {successMessage ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                {successMessage}
              </div>
            ) : null}

            {selectedOrderIds.length > 0 ? (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/80 p-4 dark:border-indigo-400/20 dark:bg-indigo-500/10">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                      Đã chọn {selectedOrderIds.length} đơn hàng
                    </p>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Trạng thái hàng loạt
                        </label>
                        <select
                          value={bulkStatus}
                          onChange={(event) =>
                            setBulkStatus(event.target.value as OrderStatus)
                          }
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-900"
                        >
                          {quickStatuses.map((statusItem) => (
                            <option key={statusItem.value} value={statusItem.value}>
                              {statusItem.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {bulkStatus === "SHIPPING" ? (
                        <>
                          <input
                            value={bulkShippingDraft.carrierName}
                            onChange={(event) =>
                              setBulkShippingDraft((current) => ({
                                ...current,
                                carrierName: event.target.value,
                              }))
                            }
                            placeholder="Tên đơn vị vận chuyển"
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-900"
                          />
                          <input
                            value={bulkShippingDraft.trackingCode}
                            onChange={(event) =>
                              setBulkShippingDraft((current) => ({
                                ...current,
                                trackingCode: event.target.value,
                              }))
                            }
                            placeholder="Mã vận đơn"
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-900"
                          />
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedOrderIds([])}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-gray-300 dark:border-gray-700 dark:text-gray-300"
                    >
                      Bá» chá»n
                    </button>
                    <button
                      type="button"
                      disabled={bulkUpdating}
                      onClick={() => void handleBulkUpdate()}
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {bulkUpdating
                        ? "Đang cập nhật..."
                        : "Cập nhật các đơn đã chọn"}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-900/60">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={isAllDisplayedSelected}
                          onChange={toggleSelectAllDisplayed}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Mã đơn
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Khách hàng
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Ngày đặt
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Tổng tiền
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Trạng thái
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Hành động
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                        >
                          <div className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang tải danh sách đơn hàng...
                          </div>
                        </td>
                      </tr>
                    ) : displayedOrders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                        >
                          Không có đơn hàng nào phù hợp bộ lọc hiện tại.
                        </td>
                      </tr>
                    ) : (
                      displayedOrders.map((order) => {
                        const isDropdownOpen = openDropdownId === order._id;
                        const selectedStatus = draftStatus[order._id] ?? order.status;

                        return (
                          <tr key={order._id} className="align-top">
                            <td className="px-6 py-5">
                              <input
                                type="checkbox"
                                checked={selectedOrderIds.includes(order._id)}
                                onChange={() => toggleSelectedOrder(order._id)}
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="px-6 py-5">
                              <div className="font-semibold text-gray-900 dark:text-white">
                                #{order._id.slice(-8).toUpperCase()}
                              </div>
                              {order.trackingCode ? (
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  Tracking: {order.trackingCode}
                                </p>
                              ) : null}
                            </td>
                            <td className="px-6 py-5 text-sm text-gray-700 dark:text-gray-300">
                              {order.shippingAddress?.fullName || "Khách vãng lai"}
                            </td>
                            <td className="px-6 py-5 text-sm text-gray-700 dark:text-gray-300">
                              {formatDate(order.createdAt)}
                            </td>
                            <td className="px-6 py-5 text-sm font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(order.totalPrice)}
                            </td>
                            <td className="px-6 py-5">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getBadgeStyles(order.status)}`}
                              >
                                {getStatusLabel(order.status)}
                              </span>
                            </td>
                            <td className="relative px-6 py-5 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenDropdownId(isDropdownOpen ? null : order._id)
                                }
                                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-indigo-200 hover:text-indigo-600 dark:border-gray-700 dark:text-gray-200"
                              >
                                Cập nhật nhanh
                                <ChevronDown className="h-4 w-4" />
                              </button>

                              {isDropdownOpen ? (
                                <div className="absolute right-6 z-20 mt-3 w-80 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-2xl dark:border-gray-800 dark:bg-gray-950">
                                  <div className="space-y-4">
                                    <div>
                                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Trạng thái mới
                                      </label>
                                      <select
                                        value={selectedStatus}
                                        onChange={(event) =>
                                          setDraftStatus((current) => ({
                                            ...current,
                                            [order._id]: event.target.value as OrderStatus,
                                          }))
                                        }
                                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-900"
                                      >
                                        {quickStatuses.map((statusItem) => (
                                          <option
                                            key={statusItem.value}
                                            value={statusItem.value}
                                          >
                                            {statusItem.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    {selectedStatus === "SHIPPING" ? (
                                      <div className="space-y-3 rounded-xl bg-blue-50/70 p-3 dark:bg-blue-500/10">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
                                          <Truck className="h-4 w-4" />
                                          Thông tin vận chuyển
                                        </div>
                                        <input
                                          value={
                                            shippingDraft[order._id]?.carrierName ?? ""
                                          }
                                          onChange={(event) =>
                                            setShippingDraft((current) => ({
                                              ...current,
                                              [order._id]: {
                                                ...current[order._id],
                                                carrierName: event.target.value,
                                              },
                                            }))
                                          }
                                          placeholder="Tên đơn vị vận chuyển"
                                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-900"
                                        />
                                        <input
                                          value={
                                            shippingDraft[order._id]?.trackingCode ?? ""
                                          }
                                          onChange={(event) =>
                                            setShippingDraft((current) => ({
                                              ...current,
                                              [order._id]: {
                                                ...current[order._id],
                                                trackingCode: event.target.value,
                                              },
                                            }))
                                          }
                                          placeholder="Mã vận đơn"
                                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-900"
                                        />
                                      </div>
                                    ) : null}

                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setOpenDropdownId(null)}
                                        className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-gray-300 dark:border-gray-700 dark:text-gray-300"
                                      >
                                        Đóng
                                      </button>
                                      <button
                                        type="button"
                                        disabled={updatingId === order._id}
                                        onClick={() => void handleQuickUpdate(order._id)}
                                        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {updatingId === order._id
                                          ? "Đang cập nhật..."
                                          : "Lưu thay đổi"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
