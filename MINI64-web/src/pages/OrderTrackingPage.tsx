import { useContext, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import ShippingTimeline from "../components/ShippingTimeline";
import { UserContext } from "../context/UserContext";
import NotFound from "./OtherPage/NotFound";
import {
  ChevronRight,
  Mail,
  MapPinned,
  MessageCircle,
  PackageCheck,
  Search,
  ShieldCheck,
  Star,
  Truck,
  X,
} from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL;

type OrderItem = {
  _id?: string;
  name: string;
  amount: number;
  image: string;
  price: number;
  scale?: string;
  product: string;
};

type OrderTrackingData = {
  _id: string;
  createdAt: string;
  updatedAt: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "PACKING"
    | "SHIPPING"
    | "DELIVERED"
    | "CANCELLED"
    | "Pending"
    | "Confirmed"
    | "Shipped"
    | "Delivered"
    | "Cancelled";
  totalPrice: number;
  shippingPrice: number;
  paymentMethod: string;
  trackingCode?: string;
  carrierName?: string;
  currentTimelineNote?: string;
  orderItems: OrderItem[];
  statusHistory?: {
    status: string;
    timestamp: string;
    note?: string;
  }[];
  shippingAddress: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
  };
};

type TrackingStep = {
  key: string;
  title: string;
  description: string;
};

const trackingSteps: TrackingStep[] = [
  {
    key: "placed",
    title: "Order Placed",
    description: "Đơn hàng của bạn đã được ghi nhận trong hệ thống Mini64.",
  },
  {
    key: "packing",
    title: "Packing",
    description: "Kho đang chuẩn bị xe mô hình và kiểm tra đóng gói an toàn.",
  },
  {
    key: "carrier",
    title: "Handed to Carrier",
    description: "Đơn hàng đã bàn giao cho đơn vị vận chuyển.",
  },
  {
    key: "transit",
    title: "In Transit",
    description: "Kiện hàng đang trên đường đến địa chỉ nhận của bạn.",
  },
  {
    key: "delivered",
    title: "Delivered",
    description: "Đơn hàng đã hoàn tất giao thành công.",
  },
];

function formatCurrency(price: number) {
  return `${price.toLocaleString("vi-VN")}đ`;
}

function formatDate(value?: string) {
  if (!value) {
    return "Đang cập nhật";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusBadge(status: OrderTrackingData["status"]) {
  switch (status) {
    case "PENDING":
    case "Pending":
    case "CONFIRMED":
    case "Confirmed":
    case "PACKING":
      return {
        label:
          status === "PENDING" || status === "Pending"
            ? "Processing"
            : status === "CONFIRMED" || status === "Confirmed"
              ? "Confirmed"
              : "Packing",
        className:
          "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300",
      };
    case "SHIPPING":
    case "Shipped":
      return {
        label: "Shipping",
        className:
          "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/20 dark:bg-orange-500/10 dark:text-orange-300",
      };
    case "DELIVERED":
    case "Delivered":
      return {
        label: "Done",
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300",
      };
    default:
      return {
        label: "Cancelled",
        className:
          "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300",
      };
  }
}

function getTrackingProgress(status: OrderTrackingData["status"]) {
  switch (status) {
    case "PENDING":
    case "Pending":
      return { completedIndex: 0, activeIndex: 0 };
    case "CONFIRMED":
    case "Confirmed":
      return { completedIndex: 0, activeIndex: 1 };
    case "PACKING":
      return { completedIndex: 1, activeIndex: 1 };
    case "SHIPPING":
    case "Shipped":
      return { completedIndex: 2, activeIndex: 3 };
    case "DELIVERED":
    case "Delivered":
      return { completedIndex: 4, activeIndex: 4 };
    case "CANCELLED":
    case "Cancelled":
    default:
      return { completedIndex: -1, activeIndex: 0 };
  }
}

function OrderTrackingPage() {
  const location = useLocation();
  const { id: routeOrderId } = useParams();
  const { user } = useContext(UserContext);
  const prefilledOrderId = location.state?.orderId ?? "";
  const prefilledEmail = location.state?.email ?? "";
  const isSecureOrderView = Boolean(routeOrderId);

  const [orderId, setOrderId] = useState(prefilledOrderId);
  const [email, setEmail] = useState(prefilledEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderTrackingData | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [reviewForm, setReviewForm] = useState({
    productId: "",
    rating: 5,
    title: "",
    comment: "",
  });
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportInput, setSupportInput] = useState("");
  const [supportMessages, setSupportMessages] = useState<
    { id: string; sender: "user" | "system"; content: string }[]
  >([]);

  const badge = useMemo(
    () => (order ? getStatusBadge(order.status) : null),
    [order],
  );
  const canReviewOrder =
    !!order && (order.status === "DELIVERED" || order.status === "Delivered");
  const fetchProtectedOrder = async (nextOrderId: string) => {
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      setAccessDenied(true);
      setError("Bạn cần đăng nhập để xem chi tiết đơn hàng này.");
      setOrder(null);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setAccessDenied(false);
      setNotFound(false);

      const response = await axios.get(`${apiUrl}/api/orders/${nextOrderId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.data?.status !== "OK") {
        throw new Error(response.data?.message || "Không thể tải đơn hàng");
      }

      const nextOrder = response.data.data as OrderTrackingData;
      setOrder(nextOrder);
      setEmail(nextOrder.shippingAddress.email);
    } catch (err) {
      console.error(err);
      setOrder(null);

      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 404) {
          setNotFound(true);
          return;
        }

        if (status === 403 || status === 401) {
          setAccessDenied(true);
          setError(
            "Đơn hàng không tồn tại hoặc không thuộc về tài khoản đang đăng nhập.",
          );
          return;
        }
      }

      setError("Không thể tải dữ liệu đơn hàng lúc này.");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderTracking = async (nextOrderId: string, nextEmail: string) => {
    try {
      setLoading(true);
      setError("");
      setAccessDenied(false);
      setNotFound(false);

      const response = await axios.get(`${apiUrl}/api/order/track`, {
        params: {
          orderId: nextOrderId.trim(),
          email: nextEmail.trim(),
        },
      });

      if (response.data?.status !== "OK") {
        throw new Error(response.data?.message || "Không tìm thấy đơn hàng");
      }

      setOrder(response.data.data);
    } catch (err) {
      console.error(err);
      setOrder(null);
      setError(
        "Không tìm thấy đơn hàng khớp với Order ID và Email bạn đã nhập.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSecureOrderView && routeOrderId) {
      void fetchProtectedOrder(routeOrderId);
      return;
    }

    if (prefilledOrderId && prefilledEmail) {
      void fetchOrderTracking(prefilledOrderId, prefilledEmail);
    }
  }, [isSecureOrderView, prefilledEmail, prefilledOrderId, routeOrderId, user?._id]);

  useEffect(() => {
    if (!order?._id || !email.trim()) {
      return;
    }

    const socket = io(apiUrl, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      socket.emit("SUBSCRIBE_ORDER_TRACKING", {
        orderId: order._id,
        email: email.trim(),
      });
    });

    socket.on("ORDER_STATUS_UPDATED", (payload) => {
      if (payload?.orderId !== order._id) {
        return;
      }

      toast.success(payload.message || "Đơn hàng của bạn vừa được cập nhật.");
      setOrder((current) =>
        current
          ? {
              ...current,
              status: payload.status,
              updatedAt: payload.updatedAt,
              trackingCode: payload.trackingCode,
              carrierName: payload.carrierName,
              currentTimelineNote: payload.currentTimelineNote,
              statusHistory: payload.statusHistory ?? current.statusHistory,
            }
          : current,
      );
    });

    socket.on("ORDER_TRACKING_ERROR", (payload) => {
      if (payload?.message) {
        console.error(payload.message);
      }
    });

    return () => {
      socket.emit("UNSUBSCRIBE_ORDER_TRACKING", {
        orderId: order._id,
      });
      socket.disconnect();
    };
  }, [email, order?._id]);

  useEffect(() => {
    if (!order) {
      return;
    }

    setReviewForm((current) => ({
      ...current,
      productId: current.productId || order.orderItems[0]?.product || "",
    }));
  }, [order]);

  useEffect(() => {
    if (!order || !isSupportOpen) {
      return;
    }

    const orderCode = `#${order._id}`;
    const seededMessage = `Chào Mini64, mình cần hỗ trợ về đơn hàng ${orderCode}.`;

    setSupportMessages((current) => {
      if (current.length > 0) {
        return current;
      }

      return [
        {
          id: `${order._id}-seed`,
          sender: "user",
          content: seededMessage,
        },
        {
          id: `${order._id}-system`,
          sender: "system",
          content:
            "Mini64 Support đã nhận ngữ cảnh đơn hàng. Hãy mô tả vấn đề của bạn, admin sẽ nắm được mã đơn ngay từ tin nhắn đầu tiên.",
        },
      ];
    });

    setSupportInput((current) => current || seededMessage);
  }, [isSupportOpen, order]);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!orderId.trim() || !email.trim()) {
      setError("Vui lòng nhập đầy đủ Order ID và Email.");
      setOrder(null);
      return;
    }

    await fetchOrderTracking(orderId, email);
  };

  const handleSubmitReview = async () => {
    if (!order || !user) {
      setReviewError("Bạn cần đăng nhập để gửi đánh giá.");
      return;
    }

    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      setReviewError("Thiếu phiên đăng nhập để gửi đánh giá.");
      return;
    }

    if (!reviewForm.productId || !reviewForm.comment.trim()) {
      setReviewError("Vui lòng chọn sản phẩm và nhập cảm nhận của bạn.");
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewError("");
      setReviewSuccess("");

      const formData = new FormData();
      formData.append("productId", reviewForm.productId);
      formData.append("rating", String(reviewForm.rating));
      formData.append("title", reviewForm.title);
      formData.append("comment", reviewForm.comment);

      await axios.post(`${apiUrl}/api/reviews`, formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setReviewSuccess("Đánh giá của bạn đã được gửi thành công.");
      toast.success("Đã gửi đánh giá sản phẩm.");
      setReviewForm((current) => ({
        ...current,
        title: "",
        comment: "",
      }));
    } catch (submitError) {
      console.error(submitError);
      setReviewError("Không thể gửi đánh giá lúc này.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleSendSupportMessage = () => {
    const message = supportInput.trim();
    if (!message) {
      return;
    }

    setSupportMessages((current) => [
      ...current,
      {
        id: `${Date.now()}`,
        sender: "user",
        content: message,
      },
    ]);
    setSupportInput("");
    toast.success("Đã chuẩn bị yêu cầu hỗ trợ kèm mã đơn hàng.");
  };

  if (notFound) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28 text-gray-900 dark:bg-gray-950 dark:text-white">
      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        <div className="rounded-[36px] border border-gray-100 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-6 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] dark:border-white/10 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.32em] text-indigo-200">
                Mini64 Tracking
              </p>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                Theo dõi đơn hàng xe mô hình của bạn
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200/85">
                Nhập Order ID và email dùng khi đặt hàng để xem trạng thái xử lý,
                hành trình giao hàng và thông tin giao nhận mới nhất.
              </p>
            </div>

            <form
              onSubmit={handleSearch}
              className="grid gap-3 rounded-[28px] border border-white/10 bg-white/10 p-4 backdrop-blur md:grid-cols-[1fr_1fr_auto]"
            >
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4">
                <Search className="h-4 w-4 text-indigo-200" />
                <input
                  type="text"
                  value={orderId}
                  onChange={(event) => setOrderId(event.target.value)}
                  placeholder="Order ID"
                  className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-slate-300"
                />
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4">
                <Mail className="h-4 w-4 text-indigo-200" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email đặt hàng"
                  className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-slate-300"
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="h-14 rounded-2xl bg-themeYellow px-6 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Đang tìm..." : "Tra cứu"}
              </button>
            </form>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-[28px] border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {order ? (
          <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-8">
              <div className="rounded-[30px] border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600 dark:text-brand-400">
                      Order Snapshot
                    </p>
                    <h2 className="mt-2 text-2xl font-bold">
                      Đơn hàng #{order._id}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Đặt lúc {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <div
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${badge?.className ?? ""}`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {badge?.label}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-gray-50 p-4 dark:bg-white/5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Payment
                    </p>
                    <p className="mt-2 text-lg font-bold">{order.paymentMethod}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4 dark:bg-white/5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Total
                    </p>
                    <p className="mt-2 text-lg font-bold text-indigo-700 dark:text-brand-400">
                      {formatCurrency(order.totalPrice)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4 dark:bg-white/5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Shipping Fee
                    </p>
                    <p className="mt-2 text-lg font-bold">
                      {formatCurrency(order.shippingPrice)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[30px] border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600 dark:text-brand-400">
                      Delivery Timeline
                    </p>
                    <h2 className="mt-2 text-2xl font-bold">Tiến trình vận chuyển</h2>
                  </div>
                  <Truck className="h-5 w-5 text-indigo-500 dark:text-brand-400" />
                </div>

                <div className="mt-8">
                  <ShippingTimeline
                    status={order.status}
                    updatedAt={order.updatedAt}
                    currentTimelineNote={order.currentTimelineNote}
                    statusHistory={order.statusHistory}
                    carrierName={order.carrierName}
                    trackingCode={order.trackingCode}
                  />
                </div>
              </div>

              <div className="rounded-[30px] border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <PackageCheck className="h-5 w-5 text-indigo-500 dark:text-brand-400" />
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600 dark:text-brand-400">
                      Order Items
                    </p>
                    <h2 className="mt-2 text-2xl font-bold">
                      {order.orderItems.length} sản phẩm trong đơn
                    </h2>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {order.orderItems.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="flex items-center gap-4 rounded-[24px] bg-gray-50 p-4 dark:bg-white/5"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-20 w-20 rounded-2xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-bold">{item.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <span>{item.scale ?? "1:64"}</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                          <span>Số lượng: {item.amount}</span>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-indigo-700 dark:text-brand-400">
                        {formatCurrency(item.price * item.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="rounded-[30px] border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600 dark:text-brand-400">
                  Order Actions
                </p>
                <h2 className="mt-2 text-2xl font-bold">Tương tác với đơn hàng</h2>
                <p className="mt-3 text-sm leading-7 text-gray-500 dark:text-gray-400">
                  Theo dõi giao hàng theo thời gian thực, đánh giá sản phẩm sau khi
                  nhận hàng và mở nhanh khung hỗ trợ nếu cần Mini64 trợ giúp.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  {canReviewOrder ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsReviewOpen(true);
                        setReviewError("");
                        setReviewSuccess("");
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
                    >
                      <Star className="h-4 w-4" />
                      Đánh giá sản phẩm
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setIsSupportOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-5 py-3 font-semibold text-gray-700 transition hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:text-gray-200 dark:hover:border-brand-500 dark:hover:text-brand-400"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Cần hỗ trợ?
                  </button>
                </div>
              </div>

              <div className="rounded-[30px] border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <MapPinned className="h-5 w-5 text-indigo-500 dark:text-brand-400" />
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600 dark:text-brand-400">
                      Live Map
                    </p>
                    <h2 className="mt-2 text-2xl font-bold">Hành trình giao hàng</h2>
                  </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-[28px] border border-indigo-100 bg-gradient-to-br from-slate-100 via-white to-indigo-50 p-5 dark:border-white/10 dark:from-slate-900 dark:via-gray-900 dark:to-brand-950">
                  <div className="relative h-72 rounded-[24px] border border-dashed border-indigo-200 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.12),_transparent_55%)] dark:border-white/10">
                    <div className="absolute left-[18%] top-[20%] flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg dark:bg-gray-900">
                      <span className="text-xs font-bold text-indigo-600 dark:text-brand-400">
                        HUB
                      </span>
                    </div>
                    <div className="absolute right-[18%] bottom-[18%] flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg dark:bg-brand-500">
                      <MapPinned className="h-5 w-5" />
                    </div>
                    <div className="absolute left-[25%] top-[32%] h-1 w-[48%] rotate-[28deg] rounded-full border border-dashed border-orange-400/80 bg-orange-300/40" />
                    <div className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-themeYellow text-black shadow-lg">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/90 px-4 py-3 text-sm text-gray-600 shadow-sm backdrop-blur dark:bg-gray-900/90 dark:text-gray-300">
                      Bản đồ giao hàng đang ở chế độ placeholder. Khi tích hợp đơn vị vận
                      chuyển, khu vực này có thể hiển thị route và checkpoint thực tế.
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[30px] border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600 dark:text-brand-400">
                  Shipping Details
                </p>
                <h2 className="mt-2 text-2xl font-bold">Thông tin người nhận</h2>

                <div className="mt-6 space-y-4 rounded-[24px] bg-gray-50 p-5 dark:bg-white/5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
                      Recipient
                    </p>
                    <p className="mt-2 text-base font-bold">
                      {order.shippingAddress.fullName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
                      Contact
                    </p>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      {order.shippingAddress.email}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {order.shippingAddress.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
                      Address
                    </p>
                    <p className="mt-2 text-sm leading-7 text-gray-600 dark:text-gray-300">
                      {order.shippingAddress.address}, {order.shippingAddress.city}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-[30px] border border-dashed border-gray-200 bg-white px-6 py-16 text-center shadow-sm dark:border-white/10 dark:bg-gray-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-brand-500/10 dark:text-brand-400">
              <Search className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-2xl font-bold">Sẵn sàng tra cứu đơn hàng</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-gray-500 dark:text-gray-400">
              Nhập Order ID và email đặt hàng ở phía trên để xem timeline xử lý,
              trạng thái vận chuyển và chi tiết đơn COD của bạn.
            </p>
            <Link
              to="/shop"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-themeYellow hover:text-black"
            >
              Khám phá thêm sản phẩm
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {isReviewOpen && order ? (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-[32px] border border-gray-100 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-gray-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600 dark:text-brand-400">
                    Review Order
                  </p>
                  <h3 className="mt-2 text-2xl font-bold">
                    Đánh giá mẫu xe bạn đã nhận
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReviewOpen(false)}
                  className="rounded-2xl border border-gray-200 p-2 text-gray-500 transition hover:text-gray-700 dark:border-white/10 dark:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Chọn mẫu xe
                  </label>
                  <select
                    value={reviewForm.productId}
                    onChange={(event) =>
                      setReviewForm((current) => ({
                        ...current,
                        productId: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-gray-950"
                  >
                    {order.orderItems.map((item, index) => (
                      <option
                        key={`${item.product}-${index}`}
                        value={item.product}
                      >
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Số sao
                  </label>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const value = index + 1;
                      const active = value <= reviewForm.rating;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setReviewForm((current) => ({
                              ...current,
                              rating: value,
                            }))
                          }
                          className={`rounded-full p-2 transition ${
                            active
                              ? "text-amber-400"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        >
                          <Star
                            className={`h-6 w-6 ${active ? "fill-current" : ""}`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <input
                  value={reviewForm.title}
                  onChange={(event) =>
                    setReviewForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Tiêu đề ngắn cho cảm nhận của bạn"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-gray-950"
                />

                <textarea
                  rows={5}
                  value={reviewForm.comment}
                  onChange={(event) =>
                    setReviewForm((current) => ({
                      ...current,
                      comment: event.target.value,
                    }))
                  }
                  placeholder="Mô tả độ hoàn thiện, nước sơn, chi tiết thân xe hoặc cảm nhận khi trưng bày..."
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-gray-950"
                />

                {reviewError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300">
                    {reviewError}
                  </div>
                ) : null}

                {reviewSuccess ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                    {reviewSuccess}
                  </div>
                ) : null}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsReviewOpen(false)}
                    className="rounded-2xl border border-gray-200 px-5 py-3 font-semibold text-gray-700 transition hover:border-gray-300 dark:border-white/10 dark:text-gray-200"
                  >
                    Để sau
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSubmitReview()}
                    disabled={reviewSubmitting}
                    className="rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {reviewSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {isSupportOpen && order ? (
          <div className="fixed inset-0 z-[80] bg-slate-950/50 backdrop-blur-sm">
            <div className="ml-auto flex h-full w-full max-w-md flex-col border-l border-white/10 bg-white shadow-2xl dark:bg-gray-950">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/10">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600 dark:text-brand-400">
                    Support Chat
                  </p>
                  <h3 className="mt-1 text-xl font-bold">
                    Hỗ trợ đơn hàng #{order._id}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSupportOpen(false)}
                  className="rounded-2xl border border-gray-200 p-2 text-gray-500 transition hover:text-gray-700 dark:border-white/10 dark:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
                {supportMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.sender === "user"
                        ? "ml-auto bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200"
                    }`}
                  >
                    {message.content}
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 px-5 py-4 dark:border-white/10">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
                  Tin nhắn đầu tiên đã gắn sẵn mã đơn hàng cho Admin
                </p>
                <textarea
                  rows={4}
                  value={supportInput}
                  onChange={(event) => setSupportInput(event.target.value)}
                  placeholder="Mô tả thêm vấn đề bạn cần Mini64 hỗ trợ..."
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-gray-900"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Khung chat này đã chuẩn bị ngữ cảnh đơn hàng để admin xử lý nhanh hơn.
                  </p>
                  <button
                    type="button"
                    onClick={handleSendSupportMessage}
                    className="shrink-0 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Gửi hỗ trợ
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default OrderTrackingPage;
