import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { ChevronRight, PackageSearch, ShoppingBag, Truck } from "lucide-react";
import { UserContext } from "../context/UserContext";
import { useCart } from "../context/CartContext";

const apiUrl = import.meta.env.VITE_API_URL;

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PACKING"
  | "SHIPPING"
  | "DELIVERED"
  | "CANCELLED";

type OrderItem = {
  name: string;
  amount: number;
  image: string;
  price: number;
  scale?: string;
  product: string;
};

type MyOrder = {
  _id: string;
  createdAt: string;
  totalPrice: number;
  status: OrderStatus;
  orderItems: OrderItem[];
  shippingAddress: {
    email: string;
  };
};

type OrderSection = {
  key: string;
  title: string;
  description: string;
  orders: MyOrder[];
};

function formatCurrency(price: number) {
  return `${price.toLocaleString("vi-VN")}đ`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getOrderCode(orderId: string) {
  return `#M64-${orderId.slice(-6).toUpperCase()}`;
}

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case "SHIPPING":
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300";
    case "DELIVERED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300";
    case "PENDING":
    case "CONFIRMED":
    case "PACKING":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300";
    default:
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300";
  }
}

function getStatusLabel(status: OrderStatus) {
  switch (status) {
    case "PENDING":
      return "Chờ xử lý";
    case "CONFIRMED":
      return "Đã xác nhận";
    case "PACKING":
      return "Đang đóng gói";
    case "SHIPPING":
      return "Đang giao";
    case "DELIVERED":
      return "Đã hoàn thành";
    default:
      return "Đã hủy";
  }
}

export default function MyOrdersTabsPage() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const { addToCart } = useCart();
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("processing");

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        return;
      }

      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        setError("Bạn cần đăng nhập để xem danh sách đơn hàng.");
        return;
      }

      try {
        setLoading(true);
        setError("");
        const response = await axios.get(`${apiUrl}/api/orders/my-orders`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setOrders(response.data?.data ?? []);
      } catch (fetchError) {
        console.error(fetchError);
        setError("Không thể tải danh sách đơn hàng của bạn.");
      } finally {
        setLoading(false);
      }
    };

    void fetchOrders();
  }, [user]);

  const totalItems = useMemo(
    () =>
      orders.reduce(
        (count, order) =>
          count +
          order.orderItems.reduce((itemCount, item) => itemCount + item.amount, 0),
        0,
      ),
    [orders],
  );

  const orderSections = useMemo<OrderSection[]>(
    () => [
      {
        key: "processing",
        title: "Chờ xử lý",
        description: "Các đơn mới tạo, đã xác nhận hoặc đang đóng gói.",
        orders: orders.filter((order) =>
          ["PENDING", "CONFIRMED", "PACKING"].includes(order.status),
        ),
      },
      {
        key: "shipping",
        title: "Đang giao",
        description: "Các đơn đã bàn giao cho đơn vị vận chuyển.",
        orders: orders.filter((order) => order.status === "SHIPPING"),
      },
      {
        key: "done",
        title: "Đã hoàn thành",
        description: "Các đơn đã giao thành công cho bạn.",
        orders: orders.filter((order) => order.status === "DELIVERED"),
      },
      {
        key: "cancelled",
        title: "Đã hủy",
        description: "Các đơn không còn tiếp tục xử lý.",
        orders: orders.filter((order) => order.status === "CANCELLED"),
      },
    ],
    [orders],
  );

  const activeSection =
    orderSections.find((section) => section.key === activeTab) ?? orderSections[0];

  const handleReorder = (order: MyOrder) => {
    order.orderItems.forEach((item) => {
      addToCart({
        productId: item.product,
        name: item.name,
        image: item.image,
        price: item.price,
        amount: item.amount,
        scale: item.scale || "1:64",
        brand: "Mini64",
        stock: 999,
      });
    });

    window.dispatchEvent(new Event("mini64:cart-open"));
    toast.success(`Đã thêm lại ${order.orderItems.length} sản phẩm vào giỏ hàng.`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-28 text-gray-900 dark:bg-gray-950 dark:text-white">
        <section className="mx-auto max-w-4xl px-5 pb-20 text-center">
          <div className="rounded-[32px] border border-gray-100 bg-white px-6 py-16 shadow-sm dark:border-white/10 dark:bg-gray-900">
            <PackageSearch className="mx-auto h-14 w-14 text-indigo-500" />
            <h1 className="mt-6 text-3xl font-bold">Đăng nhập để xem đơn hàng</h1>
            <p className="mt-3 text-sm leading-7 text-gray-500 dark:text-gray-400">
              Mini64 sẽ hiển thị toàn bộ lịch sử mua sắm và tiến trình giao hàng của bạn tại đây.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-themeYellow hover:text-black"
            >
              Đăng nhập ngay
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28 text-gray-900 dark:bg-gray-950 dark:text-white">
      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        <div className="rounded-[36px] border border-gray-100 bg-gradient-to-br from-white via-white to-indigo-50 p-6 shadow-sm dark:border-white/10 dark:from-gray-900 dark:via-gray-900 dark:to-brand-950 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-indigo-600 dark:text-brand-400">
                My Orders
              </p>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                Theo dõi bộ sưu tập bạn đã đặt mua
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-500 dark:text-gray-400">
                Nhấn vào từng tab để xem đúng nhóm trạng thái bạn cần.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] bg-white px-5 py-4 shadow-sm dark:bg-gray-900/70">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
                  Tổng đơn
                </p>
                <p className="mt-2 text-2xl font-bold">{orders.length}</p>
              </div>
              <div className="rounded-[24px] bg-white px-5 py-4 shadow-sm dark:bg-gray-900/70">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
                  Tổng mô hình
                </p>
                <p className="mt-2 text-2xl font-bold">{totalItems}</p>
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-8 rounded-[30px] border border-gray-100 bg-white px-6 py-16 text-center shadow-sm dark:border-white/10 dark:bg-gray-900">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Đang tải danh sách đơn hàng...
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-8 rounded-[30px] border border-dashed border-gray-200 bg-white px-6 py-16 text-center shadow-sm dark:border-white/10 dark:bg-gray-900">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-brand-500/10 dark:text-brand-400">
              <Truck className="h-9 w-9" />
            </div>
            <h2 className="mt-6 text-2xl font-bold">Bạn chưa có đơn hàng nào</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-gray-500 dark:text-gray-400">
              Khi bạn đặt mua những mẫu xe đầu tiên, Mini64 sẽ lưu lịch sử đơn hàng và tiến trình vận chuyển tại đây.
            </p>
            <button
              type="button"
              onClick={() => navigate("/shop")}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-themeYellow hover:text-black"
            >
              Đi shopping ngay
              <ShoppingBag className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            <div className="flex flex-wrap gap-3">
              {orderSections.map((section) => (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => setActiveTab(section.key)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    activeTab === section.key
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:bg-gray-900 dark:text-gray-300"
                  }`}
                >
                  {section.title}
                  <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-xs dark:bg-white/10">
                    {section.orders.length}
                  </span>
                </button>
              ))}
            </div>

            {activeSection ? (
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {activeSection.title}
                    </h2>
                    <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                      {activeSection.orders.length} đơn
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {activeSection.description}
                  </p>
                </div>

                <div className="space-y-6">
                  {activeSection.orders.length > 0 ? (
                    activeSection.orders.map((order) => (
                      <article
                        key={order._id}
                        className="rounded-[30px] border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900"
                      >
                        <div className="flex flex-col gap-4 border-b border-gray-100 pb-6 dark:border-white/10 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-2xl font-bold">
                                {getOrderCode(order._id)}
                              </h3>
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadge(order.status)}`}
                              >
                                {getStatusLabel(order.status)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                              Ngày đặt: {formatDate(order.createdAt)}
                            </p>
                          </div>

                          <div className="rounded-[24px] bg-gray-50 px-5 py-4 dark:bg-white/5">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
                              Tổng tiền
                            </p>
                            <p className="mt-2 text-2xl font-bold text-indigo-700 dark:text-brand-400">
                              {formatCurrency(order.totalPrice)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 space-y-4">
                          {order.orderItems.map((item, index) => (
                            <div
                              key={`${order._id}-${item.product}-${index}`}
                              className="flex flex-col gap-4 rounded-[24px] bg-gray-50 p-4 dark:bg-white/5 md:flex-row md:items-center"
                            >
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-20 w-20 rounded-2xl object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-base font-bold">{item.name}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                  <span>Tỷ lệ {item.scale || "1:64"}</span>
                                  <span>•</span>
                                  <span>Hộp tiêu chuẩn</span>
                                  <span>•</span>
                                  <span>Giá chốt đơn {formatCurrency(item.price)}</span>
                                </div>
                              </div>
                              <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                x{item.amount}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                          <Link
                            to={`/my-orders/${order._id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-5 py-3 font-semibold text-gray-700 transition hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:text-gray-200 dark:hover:border-brand-500 dark:hover:text-brand-400"
                          >
                            Xem chi tiết & Theo dõi
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleReorder(order)}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-themeYellow hover:text-black"
                          >
                            Mua lại
                            <ShoppingBag className="h-4 w-4" />
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-gray-200 bg-white px-6 py-10 text-sm text-gray-500 shadow-sm dark:border-white/10 dark:bg-gray-900 dark:text-gray-400">
                      Hiện chưa có đơn hàng nào trong nhóm "{activeSection.title}".
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
