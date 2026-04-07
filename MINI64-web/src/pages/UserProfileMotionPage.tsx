import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  ChevronRight,
  Gift,
  Heart,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Star,
  Wallet,
} from "lucide-react";
import { UserContext } from "../context/UserContext";

type ProfileForm = {
  avatar: string;
  phone: string;
  address: string;
  memberTier: "Silver" | "Gold";
  points: number;
};

type ProfileTab = "personal" | "orders" | "wishlist" | "points";

const defaultAvatar =
  "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=300&q=80";

function getProfileStorageKey(userId: string) {
  return `mini64_profile_meta_${userId}`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function UserProfileMotionPage() {
  const { user, setUser } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftForm, setDraftForm] = useState<ProfileForm>({
    avatar: defaultAvatar,
    phone: "",
    address: "",
    memberTier: "Silver",
    points: 0,
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    setDraftName(user.name);
    const storedProfile = localStorage.getItem(getProfileStorageKey(user._id));

    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile) as Partial<ProfileForm>;
        setDraftForm({
          avatar: parsed.avatar || defaultAvatar,
          phone: parsed.phone || "",
          address: parsed.address || "",
          memberTier: parsed.memberTier === "Gold" ? "Gold" : "Silver",
          points: Number(parsed.points) || 0,
        });
        return;
      } catch {
        // Ignore bad local data.
      }
    }

    setDraftForm({
      avatar: defaultAvatar,
      phone: "",
      address: "Chua thiet lap dia chi mac dinh",
      memberTier: "Silver",
      points: 120,
    });
  }, [user]);

  const sidebarItems = useMemo(
    () => [
      { label: "Thông tin cá nhân", icon: ShieldCheck, value: "personal" as ProfileTab },
      { label: "Đơn hàng của tôi", icon: Package, value: "orders" as ProfileTab },
      { label: "Xe yêu thích", icon: Heart, value: "wishlist" as ProfileTab },
      { label: "Ví Mini64 Points", icon: Wallet, value: "points" as ProfileTab },
    ],
    [],
  );

  const saveProfile = () => {
    if (!user) {
      return;
    }

    const nextUser = {
      ...user,
      name: draftName.trim() || user.name,
    };

    setUser(nextUser);
    localStorage.setItem("user_info", JSON.stringify(nextUser));
    localStorage.setItem(
      getProfileStorageKey(user._id),
      JSON.stringify(draftForm),
    );
    setIsEditing(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "orders":
        return (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900">
              <Package className="h-7 w-7 text-indigo-600" />
              <h3 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                Đơn hàng của tôi
              </h3>
              <p className="mt-3 text-sm leading-7 text-gray-500 dark:text-gray-400">
                Theo dõi tiến trình giao hàng, xem lại các mẫu xe đã mua và mở chi tiết đơn hàng chỉ với một lần chạm.
              </p>
              <Link
                to="/my-orders"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-indigo-500"
              >
                Mở danh sách đơn hàng
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-[28px] border border-gray-100 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm dark:border-white/10 dark:from-indigo-500/10 dark:to-gray-900">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600">
                Order Tools
              </p>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-white/[0.04]">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Theo dõi giao hàng real-time
                  </p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Nhận cập nhật trạng thái vận chuyển ngay khi admin đổi trạng thái.
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-white/[0.04]">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Mua lại nhanh
                  </p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Thêm lại các mẫu xe đã mua vào giỏ hàng chỉ trong một bước.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case "wishlist":
        return (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900">
              <Heart className="h-7 w-7 text-rose-500" />
              <h3 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                Xe yêu thích
              </h3>
              <p className="mt-3 text-sm leading-7 text-gray-500 dark:text-gray-400">
                Xem các mẫu xe đã thả tim, thêm nhanh vào giỏ và tiếp tục săn deal hiếm trong bộ sưu tập Mini64.
              </p>
              <Link
                to="/wishlist"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-5 py-3 font-bold text-white transition hover:bg-rose-400"
              >
                Mở wishlist
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-[28px] border border-gray-100 bg-gradient-to-br from-rose-50 to-white p-6 shadow-sm dark:border-white/10 dark:from-rose-500/10 dark:to-gray-900">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-500">
                Favorite Cars
              </p>
              <div className="mt-5 rounded-[24px] border border-dashed border-rose-200 bg-white/80 p-6 text-sm text-gray-500 dark:border-rose-500/20 dark:bg-white/[0.03] dark:text-gray-400">
                Biểu tượng trái tim ở trang chủ giờ đã có hiệu ứng pop để phản hồi rõ hơn mỗi lần bạn thêm hoặc bỏ sản phẩm yêu thích.
              </div>
            </div>
          </div>
        );
      case "points":
        return (
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <Wallet className="h-7 w-7 text-indigo-600" />
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600">
                    Mini64 Points
                  </p>
                  <h3 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    Ví thành viên
                  </h3>
                </div>
              </div>
              <div className="mt-6 rounded-[24px] bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 text-white">
                <p className="text-sm uppercase tracking-[0.24em] text-indigo-100/80">
                  Current Balance
                </p>
                <p className="mt-3 text-4xl font-bold">
                  {draftForm.points.toLocaleString("vi-VN")} pts
                </p>
                <p className="mt-3 text-sm text-indigo-100/80">
                  Hạng hiện tại: {draftForm.memberTier}
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900">
              <Gift className="h-7 w-7 text-yellow-500" />
              <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
                Quyền lợi thành viên
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-500 dark:text-gray-400">
                <li>Ưu tiên săn các mẫu giới hạn.</li>
                <li>Tích điểm cho mỗi đơn hàng.</li>
                <li>Nhận deal sớm trong Golden Hour.</li>
              </ul>
            </div>
          </div>
        );
      default:
        return (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900 lg:p-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600">
                  Personal Details
                </p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  Thông tin cá nhân
                </h2>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-gray-100 bg-gray-50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-gray-400">
                        Tên người dùng
                      </p>
                      <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                        {draftName || user?.name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-gray-100 bg-gray-50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-gray-400">
                        Email
                      </p>
                      <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-gray-100 bg-gray-50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-gray-400">
                        Số điện thoại
                      </p>
                      <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                        {draftForm.phone || "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-gray-100 bg-gray-50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-gray-400">
                        Địa chỉ mặc định
                      </p>
                      <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                        {draftForm.address || "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600">
                  Mini64 Member Card
                </p>
                <div className="mt-5 rounded-[28px] bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-700 p-5 text-white shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-white/60">
                        Premium Access
                      </p>
                      <p className="mt-2 text-2xl font-bold">Mini64 Member</p>
                    </div>
                    <Gift className="h-8 w-8 text-yellow-300" />
                  </div>
                  <div className="mt-10 flex items-end justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                        Member Tier
                      </p>
                      <p className="mt-2 text-xl font-bold">{draftForm.memberTier}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                        Current Points
                      </p>
                      <p className="mt-2 text-xl font-bold">
                        {draftForm.points.toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
                <ShoppingBag className="h-6 w-6 text-indigo-600" />
                <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
                  Góc Mini64 của bạn
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Chuyển tab ở sidebar để xem nội dung với hiệu ứng slide ngang mượt hơn.
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-28 text-gray-900 dark:bg-gray-950 dark:text-white">
        <section className="mx-auto max-w-4xl px-5 pb-20 text-center">
          <div className="rounded-[32px] border border-gray-100 bg-white px-6 py-16 shadow-sm dark:border-white/10 dark:bg-gray-900">
            <ShieldCheck className="mx-auto h-14 w-14 text-indigo-500" />
            <h1 className="mt-6 text-3xl font-bold">
              Đăng nhập để xem hồ sơ Mini64
            </h1>
            <p className="mt-3 text-sm leading-7 text-gray-500 dark:text-gray-400">
              Tài khoản của bạn sẽ lưu thông tin cá nhân, wishlist, đơn hàng và điểm thành viên tại một nơi duy nhất.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-indigo-500"
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
        <div className="grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="rounded-[32px] border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
            <div className="rounded-[28px] bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-800 p-5 text-white shadow-lg shadow-indigo-900/20">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-100/80">
                Mini64 Member
              </p>
              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold backdrop-blur">
                  {getInitials(user.name)}
                </div>
                <div>
                  <p className="text-xl font-bold">{draftName || user.name}</p>
                  <p className="mt-1 text-sm text-indigo-100/80">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setActiveTab(item.value)}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                        : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-gray-100 bg-gradient-to-br from-white via-white to-indigo-50 p-6 shadow-sm dark:border-white/10 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/50 lg:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <img
                      src={draftForm.avatar || defaultAvatar}
                      alt={user.name}
                      className="h-24 w-24 rounded-[28px] object-cover ring-4 ring-white shadow-lg dark:ring-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="absolute -bottom-2 -right-2 rounded-2xl bg-indigo-600 p-2 text-white shadow-lg transition hover:bg-indigo-500"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>

                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600">
                      Hồ sơ cá nhân
                    </p>
                    <h1 className="mt-2 text-3xl font-bold">{draftName || user.name}</h1>
                    <p className="mt-2 max-w-xl text-sm leading-7 text-gray-500 dark:text-gray-400">
                      Chuyển giữa các tab để xem hồ sơ, đơn hàng, wishlist và ví điểm với animation nhẹ nhàng hơn.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-500"
                >
                  <Pencil className="h-4 w-4" />
                  Chỉnh sửa thông tin
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 36 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -36 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {isEditing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-white p-6 shadow-2xl dark:bg-gray-900 lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600">
                  Edit Profile
                </p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  Chỉnh sửa thông tin tài khoản
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-gray-300 dark:border-white/10 dark:text-gray-300"
              >
                Đóng
              </button>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Tên người dùng
                </span>
                <input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 dark:border-white/10 dark:bg-gray-950"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  URL Avatar
                </span>
                <input
                  value={draftForm.avatar}
                  onChange={(event) =>
                    setDraftForm((current) => ({
                      ...current,
                      avatar: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 dark:border-white/10 dark:bg-gray-950"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Số điện thoại
                </span>
                <input
                  value={draftForm.phone}
                  onChange={(event) =>
                    setDraftForm((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 dark:border-white/10 dark:bg-gray-950"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Hạng thành viên
                </span>
                <select
                  value={draftForm.memberTier}
                  onChange={(event) =>
                    setDraftForm((current) => ({
                      ...current,
                      memberTier: event.target.value as "Silver" | "Gold",
                    }))
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 dark:border-white/10 dark:bg-gray-950"
                >
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Mini64 Points
                </span>
                <input
                  type="number"
                  min={0}
                  value={draftForm.points}
                  onChange={(event) =>
                    setDraftForm((current) => ({
                      ...current,
                      points: Number(event.target.value) || 0,
                    }))
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 dark:border-white/10 dark:bg-gray-950"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Địa chỉ mặc định
                </span>
                <textarea
                  rows={4}
                  value={draftForm.address}
                  onChange={(event) =>
                    setDraftForm((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 dark:border-white/10 dark:bg-gray-950"
                />
              </label>
            </div>

            <div className="mt-8 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:border-gray-300 dark:border-white/10 dark:text-gray-300"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={saveProfile}
                className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-500"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
