import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

export default function UserProfilePage() {
  const { user, setUser } = useContext(UserContext);
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
        // Ignore invalid local profile data and use defaults below.
      }
    }

    setDraftForm({
      avatar: defaultAvatar,
      phone: "",
      address: "Chưa thiết lập địa chỉ mặc định",
      memberTier: "Silver",
      points: 120,
    });
  }, [user]);

  const sidebarItems = useMemo(
    () => [
      {
        label: "Thông tin cá nhân",
        icon: ShieldCheck,
        active: true,
        href: "/profile",
      },
      {
        label: "Đơn hàng của tôi",
        icon: Package,
        active: false,
        href: "/my-orders",
      },
      {
        label: "Xe yêu thích",
        icon: Heart,
        active: false,
        href: "/wishlist",
      },
      {
        label: "Ví Mini64 Points",
        icon: Wallet,
        active: false,
        href: "/profile",
      },
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
              Tài khoản của bạn sẽ lưu thông tin cá nhân, wishlist, đơn hàng và
              điểm thành viên tại một nơi duy nhất.
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
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.24em] text-indigo-100/70">
                    Hạng
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-lg font-bold">
                    <Star className="h-4 w-4 text-yellow-300" />
                    {draftForm.memberTier}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.24em] text-indigo-100/70">
                    Points
                  </p>
                  <p className="mt-2 text-lg font-bold">
                    {draftForm.points.toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const commonClassName = `flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  item.active
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                    : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-white/5"
                }`;

                return item.active ? (
                  <div key={item.label} className={commonClassName}>
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                ) : (
                  <Link key={item.label} to={item.href} className={commonClassName}>
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                );
              })}
            </div>
          </aside>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-gray-100 bg-gradient-to-br from-white via-white to-indigo-50 p-6 shadow-sm dark:border-white/10 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/50 lg:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    {draftForm.avatar ? (
                      <img
                        src={draftForm.avatar}
                        alt={user.name}
                        className="h-24 w-24 rounded-[28px] object-cover ring-4 ring-white shadow-lg dark:ring-gray-900"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-indigo-600 text-2xl font-bold text-white">
                        {getInitials(user.name)}
                      </div>
                    )}
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
                    <h1 className="mt-2 text-3xl font-bold">
                      {draftName || user.name}
                    </h1>
                    <p className="mt-2 max-w-xl text-sm leading-7 text-gray-500 dark:text-gray-400">
                      Quản lý thông tin tài khoản, địa chỉ giao hàng mặc định và
                      quyền lợi thành viên Mini64 trong một giao diện gọn gàng.
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

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900 lg:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600">
                      Personal Details
                    </p>
                    <h2 className="mt-2 text-2xl font-bold">
                      Thông tin cá nhân
                    </h2>
                  </div>
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
                        <p className="mt-2 text-lg font-bold">{draftName || user.name}</p>
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
                        <p className="mt-2 text-lg font-bold">{user.email}</p>
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
                        <p className="mt-2 text-lg font-bold">
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
                        <p className="mt-2 text-lg font-bold">
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
                        <p className="mt-2 text-xl font-bold">
                          {draftForm.memberTier}
                        </p>
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

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <Link
                    to="/my-orders"
                    className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-white/10 dark:bg-gray-900"
                  >
                    <Package className="h-6 w-6 text-indigo-600" />
                    <h3 className="mt-4 text-lg font-bold">Đơn hàng của tôi</h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Kiểm tra tiến trình giao hàng và mua lại nhanh các mẫu đã
                      đặt.
                    </p>
                  </Link>

                  <Link
                    to="/wishlist"
                    className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-white/10 dark:bg-gray-900"
                  >
                    <Heart className="h-6 w-6 text-rose-500" />
                    <h3 className="mt-4 text-lg font-bold">Xe yêu thích</h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Theo dõi những mẫu xe bạn muốn săn và bật thông báo giảm giá.
                    </p>
                  </Link>
                </div>
              </div>
            </div>
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
