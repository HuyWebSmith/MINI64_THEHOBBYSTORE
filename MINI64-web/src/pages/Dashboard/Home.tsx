import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import {
  BadgeDollarSign,
  RefreshCcw,
  ShoppingCart,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react";
import PageMeta from "../../components/admin_component/common/PageMeta";
import PageBreadcrumb from "../../components/admin_component/common/PageBreadCrumb";
import ComponentCard from "../../components/admin_component/common/ComponentCard";

const apiUrl = import.meta.env.VITE_API_URL;

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PACKING"
  | "SHIPPING"
  | "DELIVERED"
  | "CANCELLED";

type DashboardOrder = {
  _id: string;
  createdAt: string;
  totalPrice: number;
  status: OrderStatus;
  shippingAddress?: {
    fullName?: string;
  };
};

type DashboardUser = {
  _id: string;
  role: "admin" | "user";
  isBlocked: boolean;
  createdAt: string;
};

type MetricCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  accentClass: string;
};

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  PACKING: "Đang đóng gói",
  SHIPPING: "Đang giao",
  DELIVERED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function getMonthKey(date: string | Date) {
  const parsedDate = new Date(date);
  return `${parsedDate.getFullYear()}-${parsedDate.getMonth()}`;
}

function buildRecentMonthBuckets(count: number) {
  const currentDate = new Date();
  const buckets: { key: string; label: string }[] = [];

  for (let index = count - 1; index >= 0; index -= 1) {
    const bucketDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - index,
      1,
    );

    buckets.push({
      key: `${bucketDate.getFullYear()}-${bucketDate.getMonth()}`,
      label: bucketDate.toLocaleDateString("vi-VN", {
        month: "short",
        year: "2-digit",
      }),
    });
  }

  return buckets;
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  accentClass,
}: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        </div>
        <div className={`rounded-2xl p-3 ${accentClass}`}>{icon}</div>
      </div>
    </div>
  );
}

export default function Home() {
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const monthBuckets = useMemo(() => buildRecentMonthBuckets(6), []);

  const fetchDashboardData = async () => {
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      setError("Không tìm thấy phiên đăng nhập admin.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [ordersResponse, usersResponse] = await Promise.all([
        axios.get(`${apiUrl}/api/orders`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        axios.get(`${apiUrl}/api/user/get-all`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      setOrders(ordersResponse.data?.data ?? []);
      setUsers(usersResponse.data?.data ?? []);
    } catch (err) {
      console.error(err);
      setError("Không thể tải dữ liệu thống kê dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboardData();
  }, []);

  const dashboardMetrics = useMemo(() => {
    const deliveredOrders = orders.filter((order) => order.status === "DELIVERED");
    const pendingOrders = orders.filter((order) =>
      ["PENDING", "CONFIRMED", "PACKING"].includes(order.status),
    );
    const activeUsers = users.filter((user) => !user.isBlocked);
    const blockedUsers = users.filter((user) => user.isBlocked);

    return {
      totalOrders: orders.length,
      deliveredRevenue: deliveredOrders.reduce(
        (total, order) => total + order.totalPrice,
        0,
      ),
      activeUsers: activeUsers.length,
      blockedUsers: blockedUsers.length,
      deliveredOrders: deliveredOrders.length,
      pendingOrders: pendingOrders.length,
    };
  }, [orders, users]);

  const monthlyTrend = useMemo(() => {
    const orderCounts = new Map<string, number>();
    const userCounts = new Map<string, number>();
    const revenueByMonth = new Map<string, number>();
    const allowedKeys = new Set(monthBuckets.map((bucket) => bucket.key));

    orders.forEach((order) => {
      const key = getMonthKey(order.createdAt);
      if (!allowedKeys.has(key)) {
        return;
      }

      orderCounts.set(key, (orderCounts.get(key) ?? 0) + 1);
      revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + order.totalPrice);
    });

    users.forEach((user) => {
      const key = getMonthKey(user.createdAt);
      if (!allowedKeys.has(key)) {
        return;
      }

      userCounts.set(key, (userCounts.get(key) ?? 0) + 1);
    });

    return {
      labels: monthBuckets.map((bucket) => bucket.label),
      orderSeries: monthBuckets.map((bucket) => orderCounts.get(bucket.key) ?? 0),
      userSeries: monthBuckets.map((bucket) => userCounts.get(bucket.key) ?? 0),
      revenueSeries: monthBuckets.map((bucket) =>
        Math.round((revenueByMonth.get(bucket.key) ?? 0) / 1_000_000),
      ),
    };
  }, [monthBuckets, orders, users]);

  const orderStatusData = useMemo(() => {
    const values: OrderStatus[] = [
      "PENDING",
      "CONFIRMED",
      "PACKING",
      "SHIPPING",
      "DELIVERED",
      "CANCELLED",
    ];

    return values.map((status) => ({
      label: ORDER_STATUS_LABELS[status],
      value: orders.filter((order) => order.status === status).length,
    }));
  }, [orders]);

  const userDistributionData = useMemo(() => {
    const admins = users.filter((user) => user.role === "admin").length;
    const blockedMembers = users.filter(
      (user) => user.role === "user" && user.isBlocked,
    ).length;
    const activeMembers = users.filter(
      (user) => user.role === "user" && !user.isBlocked,
    ).length;

    return [
      { label: "Admin", value: admins },
      { label: "Thành viên hoạt động", value: activeMembers },
      { label: "Thành viên bị khóa", value: blockedMembers },
    ];
  }, [users]);

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort(
          (firstOrder, secondOrder) =>
            new Date(secondOrder.createdAt).getTime() -
            new Date(firstOrder.createdAt).getTime(),
        )
        .slice(0, 6),
    [orders],
  );

  const growthChartOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "area",
        fontFamily: "Outfit, sans-serif",
        toolbar: { show: false },
      },
      colors: ["#4F46E5", "#10B981"],
      dataLabels: { enabled: false },
      stroke: {
        curve: "smooth",
        width: 3,
      },
      fill: {
        type: "gradient",
        gradient: {
          opacityFrom: 0.35,
          opacityTo: 0.03,
        },
      },
      legend: {
        position: "top",
        horizontalAlign: "left",
      },
      grid: {
        borderColor: "#E5E7EB",
        strokeDashArray: 4,
      },
      xaxis: {
        categories: monthlyTrend.labels,
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          formatter: (value: number) => `${Math.round(value)}`,
        },
      },
      tooltip: {
        shared: true,
        intersect: false,
      },
    }),
    [monthlyTrend.labels],
  );

  const revenueChartOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        fontFamily: "Outfit, sans-serif",
        toolbar: { show: false },
      },
      colors: ["#F59E0B"],
      plotOptions: {
        bar: {
          borderRadius: 8,
          columnWidth: "45%",
        },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: monthlyTrend.labels,
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          formatter: (value: number) => `${Math.round(value)}tr`,
        },
      },
      grid: {
        borderColor: "#E5E7EB",
        strokeDashArray: 4,
      },
      tooltip: {
        y: {
          formatter: (value: number) => `${value.toLocaleString("vi-VN")} triệu VND`,
        },
      },
    }),
    [monthlyTrend.labels],
  );

  const donutChartOptions = (labels: string[], colors: string[]): ApexOptions => ({
    chart: {
      type: "donut",
      fontFamily: "Outfit, sans-serif",
    },
    labels,
    colors,
    legend: {
      position: "bottom",
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 0,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
        },
      },
    },
    tooltip: {
      y: {
        formatter: (value: number) => `${value}`,
      },
    },
  });

  return (
    <>
      <PageMeta
        title="Dashboard | Mini64 Hobby Store"
        description="Trang tổng quan thống kê đơn hàng và người dùng"
      />
      <PageBreadcrumb pageTitle="Dashboard" />

      <div className="space-y-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tổng quan vận hành cửa hàng
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Theo dõi nhanh tình hình đơn hàng và người dùng trong 6 tháng gần đây.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchDashboardData()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-200"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới dữ liệu
          </button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Tổng đơn hàng"
            value={dashboardMetrics.totalOrders.toLocaleString("vi-VN")}
            subtitle={`${dashboardMetrics.pendingOrders} đơn đang chờ xử lý`}
            icon={<ShoppingCart className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />}
            accentClass="bg-indigo-50 dark:bg-indigo-500/10"
          />
          <MetricCard
            title="Doanh thu đã giao"
            value={formatCurrency(dashboardMetrics.deliveredRevenue)}
            subtitle={`${dashboardMetrics.deliveredOrders} đơn đã hoàn thành`}
            icon={
              <BadgeDollarSign className="h-6 w-6 text-amber-600 dark:text-amber-300" />
            }
            accentClass="bg-amber-50 dark:bg-amber-500/10"
          />
          <MetricCard
            title="Người dùng hoạt động"
            value={dashboardMetrics.activeUsers.toLocaleString("vi-VN")}
            subtitle={`${users.length.toLocaleString("vi-VN")} tài khoản đã đăng ký`}
            icon={<UserRoundCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />}
            accentClass="bg-emerald-50 dark:bg-emerald-500/10"
          />
          <MetricCard
            title="Tài khoản bị khóa"
            value={dashboardMetrics.blockedUsers.toLocaleString("vi-VN")}
            subtitle="Cần theo dõi hoặc xem lại quyền truy cập"
            icon={<UserRoundX className="h-6 w-6 text-rose-600 dark:text-rose-300" />}
            accentClass="bg-rose-50 dark:bg-rose-500/10"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <ComponentCard
              title="Đơn hàng và người dùng mới theo tháng"
              desc="So sánh tốc độ tăng trưởng đơn hàng và đăng ký mới trong 6 tháng gần nhất."
            >
              {loading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Đang tải biểu đồ tăng trưởng...
                </p>
              ) : (
                <Chart
                  options={growthChartOptions}
                  series={[
                    { name: "Đơn hàng", data: monthlyTrend.orderSeries },
                    { name: "Người dùng mới", data: monthlyTrend.userSeries },
                  ]}
                  type="area"
                  height={320}
                />
              )}
            </ComponentCard>
          </div>

          <div className="xl:col-span-4">
            <ComponentCard
              title="Trạng thái đơn hàng"
              desc="Tỷ lệ từng trạng thái hiện có trong toàn bộ đơn hàng."
            >
              {loading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Đang tải biểu đồ trạng thái...
                </p>
              ) : orders.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Chưa có dữ liệu đơn hàng để hiển thị.
                </p>
              ) : (
                <Chart
                  options={donutChartOptions(
                    orderStatusData.map((item) => item.label),
                    ["#6366F1", "#8B5CF6", "#F59E0B", "#0EA5E9", "#10B981", "#EF4444"],
                  )}
                  series={orderStatusData.map((item) => item.value)}
                  type="donut"
                  height={320}
                />
              )}
            </ComponentCard>
          </div>

          <div className="xl:col-span-7">
            <ComponentCard
              title="Doanh thu theo tháng"
              desc="Biểu đồ doanh thu gộp theo tháng, đơn vị hiển thị là triệu VND."
            >
              {loading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Đang tải biểu đồ doanh thu...
                </p>
              ) : (
                <Chart
                  options={revenueChartOptions}
                  series={[
                    {
                      name: "Doanh thu",
                      data: monthlyTrend.revenueSeries,
                    },
                  ]}
                  type="bar"
                  height={320}
                />
              )}
            </ComponentCard>
          </div>

          <div className="xl:col-span-5">
            <ComponentCard
              title="Cơ cấu người dùng"
              desc="Phân tách admin, thành viên hoạt động và thành viên bị khóa."
            >
              {loading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Đang tải biểu đồ người dùng...
                </p>
              ) : users.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Chưa có dữ liệu người dùng để hiển thị.
                </p>
              ) : (
                <Chart
                  options={donutChartOptions(
                    userDistributionData.map((item) => item.label),
                    ["#0F172A", "#10B981", "#EF4444"],
                  )}
                  series={userDistributionData.map((item) => item.value)}
                  type="donut"
                  height={320}
                />
              )}
            </ComponentCard>
          </div>
        </div>

        <ComponentCard
          title="Đơn hàng gần đây"
          desc="Danh sách 6 đơn mới nhất để admin theo dõi nhanh."
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-900/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Mã đơn
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Khách hàng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Ngày tạo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Giá trị
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      Đang tải danh sách đơn hàng...
                    </td>
                  </tr>
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      Chưa có đơn hàng nào để hiển thị.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order._id} className="bg-white dark:bg-transparent">
                      <td className="px-4 py-4 font-semibold text-gray-900 dark:text-white">
                        #{order._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {order.shippingAddress?.fullName || "Khách vãng lai"}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {formatShortDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(order.totalPrice)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
