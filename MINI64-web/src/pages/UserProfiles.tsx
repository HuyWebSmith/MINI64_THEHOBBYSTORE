import { useEffect, useState } from "react";
import axios from "axios";
import PageBreadcrumb from "../components/admin_component/common/PageBreadCrumb";
import PageMeta from "../components/admin_component/common/PageMeta";

const apiUrl = import.meta.env.VITE_API_URL;

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "user";
  createdAt: string;
}

export default function UserProfiles() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      setError("Khong tim thay access token admin de tai danh sach nguoi dung.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${apiUrl}/api/user/get-all`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setUsers(response.data?.data ?? []);
    } catch (err) {
      setError("Khong the tai danh sach nguoi dung tu database.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (userId: string) => {
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      setError("Ban can dang nhap tai khoan admin de xoa nguoi dung.");
      return;
    }

    if (!window.confirm("Ban co chac chan muon xoa nguoi dung nay?")) {
      return;
    }

    try {
      await axios.delete(`${apiUrl}/api/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setUsers((currentUsers) =>
        currentUsers.filter((user) => user._id !== userId),
      );
    } catch (err) {
      setError("Xoa nguoi dung that bai. Vui long kiem tra quyen admin.");
      console.error(err);
    }
  };

  return (
    <>
      <PageMeta
        title="Quan ly nguoi dung | Mini64 Hobby Store"
        description="Trang admin dong bo danh sach nguoi dung tu MongoDB"
      />
      <PageBreadcrumb pageTitle="User Management" />

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="mb-5 flex flex-col gap-4 border-b border-gray-100 pb-5 dark:border-gray-800 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Danh sach nguoi dung
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Dong bo tai khoan tu database de admin theo doi va quan ly.
              </p>
            </div>
            <button
              onClick={fetchUsers}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-indigo-500 hover:text-indigo-600 dark:border-gray-700 dark:text-gray-200"
            >
              Lam moi
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Dang dong bo nguoi dung tu database...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
              {error}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-gray-50 px-4 py-4 dark:bg-white/[0.03]">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tong nguoi dung
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                    {users.length}
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 px-4 py-4 dark:bg-white/[0.03]">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tai khoan admin
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                    {users.filter((user) => user.role === "admin").length}
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 px-4 py-4 dark:bg-white/[0.03]">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Khach hang
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                    {users.filter((user) => user.role === "user").length}
                  </p>
                </div>
              </div>

              <div className="max-w-full overflow-x-auto">
                <table className="w-full min-w-[840px] table-auto">
                  <thead>
                    <tr className="bg-gray-100 text-left dark:bg-white/[0.05]">
                      <th className="px-4 py-4 font-medium text-gray-700 dark:text-white">
                        Nguoi dung
                      </th>
                      <th className="px-4 py-4 font-medium text-gray-700 dark:text-white">
                        Email
                      </th>
                      <th className="px-4 py-4 font-medium text-gray-700 dark:text-white">
                        So dien thoai
                      </th>
                      <th className="px-4 py-4 font-medium text-gray-700 dark:text-white">
                        Vai tro
                      </th>
                      <th className="px-4 py-4 font-medium text-gray-700 dark:text-white">
                        Tao luc
                      </th>
                      <th className="px-4 py-4 text-right font-medium text-gray-700 dark:text-white">
                        Thao tac
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td className="border-b border-gray-100 px-4 py-5 dark:border-gray-800">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white/90">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              ID: {user._id}
                            </p>
                          </div>
                        </td>
                        <td className="border-b border-gray-100 px-4 py-5 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-300">
                          {user.email}
                        </td>
                        <td className="border-b border-gray-100 px-4 py-5 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-300">
                          {user.phone}
                        </td>
                        <td className="border-b border-gray-100 px-4 py-5 dark:border-gray-800">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              user.role === "admin"
                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="border-b border-gray-100 px-4 py-5 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-300">
                          {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="border-b border-gray-100 px-4 py-5 text-right dark:border-gray-800">
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:bg-red-950/20 dark:text-red-300"
                          >
                            Xoa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
