import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import { CheckCheck, Circle, Loader2, Package, Truck } from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL;

export type AdminOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PACKING"
  | "SHIPPING"
  | "DELIVERED"
  | "CANCELLED";

type AdminOrderDetail = {
  _id: string;
  status: AdminOrderStatus;
  trackingCode?: string;
  carrierName?: string;
  currentTimelineNote?: string;
};

type AdminOrderTrackingStepperProps = {
  order: AdminOrderDetail;
  onUpdated: () => Promise<unknown>;
};

type StepItem = {
  key: AdminOrderStatus;
  label: string;
  icon: ReactNode;
};

const steps: StepItem[] = [
  {
    key: "PENDING",
    label: "Chờ xác nhận",
    icon: <Circle className="h-4 w-4" />,
  },
  {
    key: "PACKING",
    label: "Đóng gói",
    icon: <Package className="h-4 w-4" />,
  },
  {
    key: "SHIPPING",
    label: "Đang giao",
    icon: <Truck className="h-4 w-4" />,
  },
  {
    key: "DELIVERED",
    label: "Hoàn tất",
    icon: <CheckCheck className="h-4 w-4" />,
  },
];

const nextStatuses: { label: string; value: AdminOrderStatus }[] = [
  { label: "Chờ xác nhận", value: "PENDING" },
  { label: "Đã xác nhận", value: "CONFIRMED" },
  { label: "Đang đóng gói", value: "PACKING" },
  { label: "Đang giao hàng", value: "SHIPPING" },
  { label: "Đã giao", value: "DELIVERED" },
  { label: "Đã hủy", value: "CANCELLED" },
];

function getVisualStage(status: AdminOrderStatus) {
  switch (status) {
    case "CONFIRMED":
      return "PENDING";
    case "CANCELLED":
      return "PENDING";
    default:
      return status;
  }
}

function getCurrentIndex(status: AdminOrderStatus) {
  return steps.findIndex((step) => step.key === getVisualStage(status));
}

export default function AdminOrderTrackingStepper({
  order,
  onUpdated,
}: AdminOrderTrackingStepperProps) {
  const [status, setStatus] = useState<AdminOrderStatus>(order.status);
  const [note, setNote] = useState(order.currentTimelineNote ?? "");
  const [trackingCode, setTrackingCode] = useState(order.trackingCode ?? "");
  const [carrierName, setCarrierName] = useState(order.carrierName ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const currentIndex = useMemo(() => getCurrentIndex(order.status), [order.status]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        throw new Error("Bạn cần đăng nhập bằng tài khoản admin.");
      }

      const payload: {
        status: AdminOrderStatus;
        note: string;
        trackingCode?: string;
        carrierName?: string;
      } = {
        status,
        note,
      };

      if (status === "SHIPPING") {
        payload.trackingCode = trackingCode;
        payload.carrierName = carrierName;
      }

      const response = await axios.put(
        `${apiUrl}/api/orders/update-status/${order._id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.data?.status !== "OK") {
        throw new Error(response.data?.message || "Không thể cập nhật trạng thái");
      }

      await onUpdated();
      setSuccessMessage("Đã lưu thay đổi và làm mới dữ liệu đơn hàng.");
    } catch (submitError) {
      console.error(submitError);
      setError("Không thể cập nhật trạng thái đơn hàng lúc này.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/70">
        <div className="flex flex-wrap items-center gap-4 md:flex-nowrap">
          {steps.map((step, index) => {
            const isCompleted = currentIndex > index;
            const isCurrent = currentIndex === index;

            return (
              <div key={step.key} className="flex min-w-[120px] flex-1 items-center">
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border text-sm font-semibold transition ${
                      isCompleted
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : isCurrent
                          ? "animate-pulse border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15"
                          : "border-gray-200 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500"
                    }`}
                  >
                    {step.icon}
                  </div>
                  <span
                    className={`mt-3 text-xs font-semibold uppercase tracking-[0.18em] ${
                      isCompleted || isCurrent
                        ? "text-indigo-600 dark:text-indigo-300"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {index < steps.length - 1 ? (
                  <div
                    className={`mx-3 hidden h-1 flex-1 rounded-full md:block ${
                      currentIndex > index
                        ? "bg-indigo-600"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Trạng thái tiếp theo
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as AdminOrderStatus)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-950"
            >
              {nextStatuses.map((statusItem) => (
                <option key={statusItem.value} value={statusItem.value}>
                  {statusItem.label}
                </option>
              ))}
            </select>
          </div>

          {status === "SHIPPING" ? (
            <>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Đơn vị vận chuyển
                </label>
                <input
                  value={carrierName}
                  onChange={(event) => setCarrierName(event.target.value)}
                  placeholder="Ví dụ: GHN, GHTK, J&T"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-950"
                />
              </div>
              <div className="lg:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Mã vận đơn
                </label>
                <input
                  value={trackingCode}
                  onChange={(event) => setTrackingCode(event.target.value)}
                  placeholder="Nhập mã vận đơn"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-950"
                />
              </div>
            </>
          ) : null}

          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Ghi chú vận chuyển
            </label>
            <textarea
              rows={4}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ví dụ: Đã bàn giao cho bưu tá, khách hẹn nhận chiều nay..."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-950"
            />
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            {successMessage}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}
