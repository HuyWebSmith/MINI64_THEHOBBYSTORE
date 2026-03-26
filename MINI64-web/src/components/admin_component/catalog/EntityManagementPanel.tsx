import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import axios from "axios";

interface EntityItem {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  image?: string;
  createdAt?: string;
}

interface EntityManagementPanelProps {
  title: string;
  description: string;
  entityLabel: string;
  entityLabelPlural: string;
  fetchUrl: string;
  createUrl: string;
  updateUrlBase: string;
  deleteUrlBase: string;
  mediaFieldKey: "logo" | "image";
  mediaFieldLabel: string;
}

interface FormState {
  name: string;
  description: string;
  media: string;
}

const initialFormState: FormState = {
  name: "",
  description: "",
  media: "",
};

const EntityManagementPanel = ({
  title,
  description,
  entityLabel,
  entityLabelPlural,
  fetchUrl,
  createUrl,
  updateUrlBase,
  deleteUrlBase,
  mediaFieldKey,
  mediaFieldLabel,
}: EntityManagementPanelProps) => {
  const [items, setItems] = useState<EntityItem[]>([]);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showModal, setShowModal] = useState(false); // Trạng thái đóng mở Modal

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(fetchUrl, {
        params: { limit: 100, page: 0 },
      });
      setItems(response.data?.data ?? []);
    } catch (err) {
      setError(`Không thể tải danh sách ${entityLabelPlural.toLowerCase()}.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [fetchUrl]);

  const closeModal = () => {
    setShowModal(false);
    setFormState(initialFormState);
    setEditingId(null);
    setError("");
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const getAuthHeaders = () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) throw new Error("Bạn cần đăng nhập quyền admin.");
    return { Authorization: `Bearer ${accessToken}` };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      const payload = {
        name: formState.name,
        description: formState.description,
        [mediaFieldKey]: formState.media,
      };

      if (editingId) {
        await axios.put(`${updateUrlBase}/${editingId}`, payload, {
          headers: getAuthHeaders(),
        });
        setSuccessMessage(`Cập nhật ${entityLabel.toLowerCase()} thành công.`);
      } else {
        await axios.post(createUrl, payload, {
          headers: getAuthHeaders(),
        });
        setSuccessMessage(`Thêm ${entityLabel.toLowerCase()} thành công.`);
      }

      closeModal();
      fetchItems();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(`Lỗi: Không thể lưu ${entityLabel.toLowerCase()}.`);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: EntityItem) => {
    setEditingId(item._id);
    setFormState({
      name: item.name ?? "",
      description: item.description ?? "",
      media: item[mediaFieldKey] ?? "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa ${entityLabel.toLowerCase()} này?`,
      )
    )
      return;
    try {
      await axios.delete(`${deleteUrlBase}/${id}`, {
        headers: getAuthHeaders(),
      });
      setItems((prev) => prev.filter((item) => item._id !== id));
      setSuccessMessage("Xóa thành công.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Không thể xóa dữ liệu.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Button Thêm mới */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">
              {title}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
          >
            + Thêm {entityLabel} mới
          </button>
        </div>

        {successMessage && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}
      </div>

      {/* MODAL OVERLAY */}
      {showModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="mb-5 flex items-center justify-between border-b pb-4 dark:border-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingId
                  ? `Chỉnh sửa ${entityLabel}`
                  : `Thêm ${entityLabel} mới`}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <span className="text-sm font-medium">
                  Tên {entityLabel.toLowerCase()}
                </span>
                <input
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-gray-200 p-3 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">
                  {mediaFieldLabel} (Link URL)
                </span>
                <input
                  name="media"
                  value={formState.media}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-gray-200 p-3 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Mô tả</span>
                <textarea
                  name="description"
                  value={formState.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 p-3 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 text-sm font-semibold border rounded-xl hover:bg-gray-50 dark:border-gray-700"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 text-white px-5 py-2.5 text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting
                    ? "Đang xử lý..."
                    : editingId
                      ? "Cập nhật dữ liệu"
                      : "Lưu dữ liệu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TABLE LIST */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-5 flex items-center justify-between border-b pb-5 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">
            Danh sách {entityLabelPlural.toLowerCase()}
          </h3>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-500">
            Đang tải dữ liệu...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50 text-left dark:bg-white/5">
                  <th className="px-4 py-4 font-medium">{entityLabel}</th>
                  <th className="px-4 py-4 font-medium">{mediaFieldLabel}</th>
                  <th className="px-4 py-4 font-medium">Mô tả</th>
                  <th className="px-4 py-4 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="px-4 py-4 font-medium">{item.name}</td>
                    <td className="px-4 py-4">
                      {item[mediaFieldKey] ? (
                        <img
                          src={item[mediaFieldKey]}
                          className="h-10 w-10 object-contain rounded border"
                          alt="logo"
                        />
                      ) : (
                        "Trống"
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 truncate max-w-[200px]">
                      {item.description || "--"}
                    </td>
                    <td className="px-4 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-indigo-600 hover:underline"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-red-500 hover:underline"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityManagementPanel;
