import { useEffect, useState } from "react";
import axios from "axios";
import {
  Lock,
  Unlock,
  AlertTriangle,
  RotateCcw,
  Users,
  UserX,
  ShieldCheck,
} from "lucide-react";
import PageBreadcrumb from "../components/admin_component/common/PageBreadCrumb";
import PageMeta from "../components/admin_component/common/PageMeta";

const apiUrl = import.meta.env.VITE_API_URL;

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "user";
  isBlocked: boolean;
  createdAt: string;
}

export default function UserProfiles() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    userId: string;
    userName: string;
    currentStatus: boolean;
  }>({ show: false, userId: "", userName: "", currentStatus: false });

  const fetchUsers = async () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) return;
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/api/user/get-all`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setUsers(response.data?.data ?? []);
    } catch (err) {
      setError("Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleBlock = async () => {
    const { userId, currentStatus } = confirmModal;
    const accessToken = localStorage.getItem("access_token");
    try {
      await axios.patch(
        `${apiUrl}/api/auth/lock-user/${userId}`,
        { isBlocked: !currentStatus },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isBlocked: !currentStatus } : u,
        ),
      );
      setConfirmModal({ ...confirmModal, show: false });
    } catch (err: any) {
      alert(err.response?.data?.message || "Thao tác thất bại!");
    }
  };

  return (
    <>
      <PageMeta
        title="Quản lý người dùng | Mini64"
        description="Quản lý thành viên"
      />
      <PageBreadcrumb pageTitle="Quản lý người dùng" />

      <div className="space-y-6">
        {/* --- KHỐI THỐNG KÊ NHANH --- */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng thành viên</p>
              <p className="text-xl font-bold">{users.length}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] flex items-center gap-4">
            <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-xl">
              <UserX size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Đang bị khóa</p>
              <p className="text-xl font-bold">
                {users.filter((u) => u.isBlocked).length}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-xl">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Quản trị viên</p>
              <p className="text-xl font-bold">
                {users.filter((u) => u.role === "admin").length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              Danh sách chi tiết
            </h3>
            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg transition"
            >
              <RotateCcw size={16} className={loading ? "animate-spin" : ""} />{" "}
              Làm mới
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left bg-gray-50 dark:bg-white/5 border-b dark:border-gray-800">
                  <th className="p-4 font-semibold text-sm">Thành viên</th>
                  <th className="p-4 font-semibold text-sm">Email</th>
                  <th className="p-4 font-semibold text-sm">Vai trò</th>
                  <th className="p-4 font-semibold text-sm">Trạng thái</th>
                  <th className="p-4 font-semibold text-sm text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className={`border-b dark:border-gray-800 ${user.isBlocked ? "opacity-50 bg-gray-50/30" : ""}`}
                  >
                    <td className="p-4 font-medium">{user.name}</td>
                    <td className="p-4 text-sm text-gray-500">{user.email}</td>
                    <td className="p-4 text-sm font-bold uppercase text-indigo-500">
                      {user.role}
                    </td>
                    <td className="p-4">
                      {user.isBlocked ? (
                        <span className="inline-flex items-center gap-1.5 text-red-600 text-xs font-medium bg-red-50 px-2 py-1 rounded">
                          <Lock size={12} /> Khóa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded">
                          <Unlock size={12} /> Hoạt động
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {user.role === "admin" ? (
                        <span className="text-gray-400 text-xs italic">
                          Bảo vệ
                        </span>
                      ) : (
                        <button
                          onClick={() =>
                            setConfirmModal({
                              show: true,
                              userId: user._id,
                              userName: user.name,
                              currentStatus: user.isBlocked,
                            })
                          }
                          className={`p-2 rounded-xl transition-all ${user.isBlocked ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}
                        >
                          {user.isBlocked ? (
                            <Unlock size={18} />
                          ) : (
                            <Lock size={18} />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL XÁC NHẬN */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-md">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div
                className={`p-4 rounded-full mb-5 ${confirmModal.currentStatus ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}
              >
                <AlertTriangle size={40} />
              </div>
              <h4 className="text-2xl font-black mb-3 text-gray-900 dark:text-white">
                Xác nhận
              </h4>
              <p className="text-gray-500 text-sm mb-8 italic">
                Bạn muốn {confirmModal.currentStatus ? "MỞ" : "KHÓA"} tài khoản{" "}
                {confirmModal.userName}?
              </p>
              <div className="flex w-full gap-4">
                <button
                  onClick={() =>
                    setConfirmModal({ ...confirmModal, show: false })
                  }
                  className="flex-1 py-3 bg-gray-100 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  onClick={handleToggleBlock}
                  className={`flex-1 py-3 rounded-xl font-bold text-white ${confirmModal.currentStatus ? "bg-emerald-600" : "bg-red-600"}`}
                >
                  Đồng ý
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
