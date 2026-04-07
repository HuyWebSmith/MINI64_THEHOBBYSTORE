import { motion } from "framer-motion";
import { CheckCheck, ClipboardCheck, Copy, FileCheck2, Gift, House, Truck } from "lucide-react";
import toast from "react-hot-toast";

type TimelineStatus =
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

type StatusHistoryItem = {
  status: string;
  timestamp: string;
  note?: string;
};

type ShippingTimelineProps = {
  status: TimelineStatus;
  updatedAt: string;
  currentTimelineNote?: string;
  statusHistory?: StatusHistoryItem[];
  carrierName?: string;
  trackingCode?: string;
};

type TimelineStep = {
  key: string;
  title: string;
  statusKeys: string[];
  defaultNote: string;
  icon: typeof FileCheck2;
};

const timelineSteps: TimelineStep[] = [
  {
    key: "PENDING",
    title: "Xác nhận đơn",
    statusKeys: ["PENDING", "Pending", "CONFIRMED", "Confirmed"],
    defaultNote: "Đơn hàng đã được tiếp nhận và đang chờ xác nhận.",
    icon: FileCheck2,
  },
  {
    key: "PACKING",
    title: "Đóng gói hàng",
    statusKeys: ["PACKING"],
    defaultNote: "Kho Mini64 đang đóng gói xe mô hình cẩn thận trước khi xuất kho.",
    icon: Gift,
  },
  {
    key: "SHIPPING",
    title: "Đang giao hàng",
    statusKeys: ["SHIPPING", "Shipped"],
    defaultNote: "Đơn hàng đã rời kho và đang trên đường giao đến bạn.",
    icon: Truck,
  },
  {
    key: "DELIVERED",
    title: "Giao thành công",
    statusKeys: ["DELIVERED", "Delivered"],
    defaultNote: "Đơn hàng đã được giao thành công đến địa chỉ nhận.",
    icon: House,
  },
];

function formatTimelineTime(value?: string) {
  if (!value) {
    return "Đang cập nhật";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

function normalizeStepIndex(status: TimelineStatus) {
  switch (status) {
    case "PENDING":
    case "Pending":
    case "CONFIRMED":
    case "Confirmed":
      return 0;
    case "PACKING":
      return 1;
    case "SHIPPING":
    case "Shipped":
      return 2;
    case "DELIVERED":
    case "Delivered":
      return 3;
    default:
      return 0;
  }
}

function getHistoryEntry(
  step: TimelineStep,
  history: StatusHistoryItem[] = [],
  fallbackTimestamp: string,
  fallbackNote?: string,
) {
  const matched = [...history]
    .reverse()
    .find((entry) => step.statusKeys.includes(entry.status));

  return {
    timestamp: matched?.timestamp ?? fallbackTimestamp,
    note: matched?.note || fallbackNote || step.defaultNote,
  };
}

export default function ShippingTimeline({
  status,
  updatedAt,
  currentTimelineNote,
  statusHistory,
  carrierName,
  trackingCode,
}: ShippingTimelineProps) {
  const activeIndex = normalizeStepIndex(status);

  const handleCopyTrackingCode = async () => {
    if (!trackingCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(trackingCode);
      toast.success("Đã sao chép mã vận đơn.");
    } catch (error) {
      console.error(error);
      toast.error("Không thể sao chép mã vận đơn.");
    }
  };

  return (
    <div className="space-y-5">
      {timelineSteps.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = index < activeIndex;
        const isCurrent = index === activeIndex;
        const isPending = index > activeIndex;
        const historyEntry = getHistoryEntry(
          step,
          statusHistory,
          updatedAt,
          isCurrent ? currentTimelineNote : undefined,
        );

        return (
          <motion.div
            key={step.key}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.08 }}
            className="flex gap-4"
          >
            <div className="flex flex-col items-center">
              <div className="relative flex h-12 w-12 items-center justify-center">
                {isCurrent ? (
                  <span className="absolute inline-flex h-12 w-12 animate-ping rounded-full bg-emerald-400/35" />
                ) : null}
                <div
                  className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border transition ${
                    isCompleted
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : isCurrent
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-gray-200 bg-white text-gray-400 dark:border-white/10 dark:bg-gray-950 dark:text-gray-500"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              {index < timelineSteps.length - 1 ? (
                <div
                  className={`mt-2 w-px flex-1 ${
                    isCompleted || isCurrent
                      ? "bg-indigo-500 dark:bg-brand-500"
                      : "bg-gray-200 dark:bg-white/10"
                  }`}
                />
              ) : null}
            </div>

            <div className="flex-1 rounded-[24px] border border-gray-100 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p
                  className={`text-base font-bold ${
                    isPending
                      ? "text-gray-400 dark:text-gray-500"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {step.title}
                </p>
                <span
                  className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                    isCurrent
                      ? "text-emerald-600 dark:text-emerald-300"
                      : isCompleted
                        ? "text-indigo-600 dark:text-brand-400"
                        : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {formatTimelineTime(historyEntry.timestamp)}
                </span>
              </div>

              <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">
                {historyEntry.note}
              </p>

              {step.key === "SHIPPING" &&
              (carrierName || trackingCode) &&
              (isCurrent || isCompleted) ? (
                <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-400/20 dark:bg-blue-500/10">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    {carrierName ? (
                      <span className="font-semibold text-blue-700 dark:text-blue-300">
                        Đơn vị vận chuyển: {carrierName}
                      </span>
                    ) : null}
                    {trackingCode ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-blue-700 dark:text-blue-200">
                          {trackingCode}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyTrackingCode}
                          className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-400/20 dark:bg-blue-950/60 dark:text-blue-200"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Sao chép mã
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {step.key === "DELIVERED" && (isCurrent || isCompleted) ? (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  Giao hàng hoàn tất
                </div>
              ) : null}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
