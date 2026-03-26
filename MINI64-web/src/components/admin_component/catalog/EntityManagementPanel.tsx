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

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(fetchUrl, {
        params: { limit: 100, page: 0 },
      });

      setItems(response.data?.data ?? []);
    } catch (err) {
      setError(`Khong the tai danh sach ${entityLabelPlural.toLowerCase()} tu database.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [fetchUrl]);

  const resetForm = () => {
    setFormState(initialFormState);
    setEditingId(null);
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormState((currentState) => ({
      ...currentState,
      [name]: value,
    }));
  };

  const getAuthHeaders = () => {
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      throw new Error("Ban can dang nhap bang tai khoan admin.");
    }

    return {
      Authorization: `Bearer ${accessToken}`,
    };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      const payload = {
        name: formState.name,
        description: formState.description,
        [mediaFieldKey]: formState.media,
      };

      if (editingId) {
        await axios.put(`${updateUrlBase}/${editingId}`, payload, {
          headers: getAuthHeaders(),
        });
        setSuccessMessage(`Cap nhat ${entityLabel.toLowerCase()} thanh cong.`);
      } else {
        await axios.post(createUrl, payload, {
          headers: getAuthHeaders(),
        });
        setSuccessMessage(`Them ${entityLabel.toLowerCase()} thanh cong.`);
      }

      resetForm();
      fetchItems();
    } catch (err) {
      setError(`Khong the luu ${entityLabel.toLowerCase()}. Vui long kiem tra du lieu va quyen admin.`);
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
    setError("");
    setSuccessMessage("");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Ban co chac chan muon xoa ${entityLabel.toLowerCase()} nay?`)) {
      return;
    }

    try {
      setError("");
      setSuccessMessage("");

      await axios.delete(`${deleteUrlBase}/${id}`, {
        headers: getAuthHeaders(),
      });

      setItems((currentItems) => currentItems.filter((item) => item._id !== id));

      if (editingId === id) {
        resetForm();
      }

      setSuccessMessage(`Da xoa ${entityLabel.toLowerCase()} thanh cong.`);
    } catch (err) {
      setError(`Khong the xoa ${entityLabel.toLowerCase()}.`);
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-5 border-b border-gray-100 pb-5 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          {error && (
            <div className="md:col-span-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="md:col-span-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
              {successMessage}
            </div>
          )}

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Ten {entityLabel.toLowerCase()}
            </span>
            <input
              name="name"
              value={formState.name}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {mediaFieldLabel}
            </span>
            <input
              name="media"
              value={formState.media}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Mo ta
            </span>
            <textarea
              name="description"
              value={formState.description}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </label>

          <div className="md:col-span-2 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-400 dark:border-gray-700 dark:text-gray-200"
            >
              Dat lai
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Dang luu..."
                : editingId
                  ? `Cap nhat ${entityLabel.toLowerCase()}`
                  : `Them ${entityLabel.toLowerCase()}`}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-5 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">
              Danh sach {entityLabelPlural.toLowerCase()}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Co {items.length} {entityLabelPlural.toLowerCase()} dang duoc dong bo.
            </p>
          </div>
          <button
            onClick={fetchItems}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-indigo-500 hover:text-indigo-600 dark:border-gray-700 dark:text-gray-200"
          >
            Lam moi
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Dang tai danh sach {entityLabelPlural.toLowerCase()}...
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[780px] table-auto">
              <thead>
                <tr className="bg-gray-100 text-left dark:bg-white/[0.05]">
                  <th className="px-4 py-4 font-medium text-gray-700 dark:text-white">
                    {entityLabel}
                  </th>
                  <th className="px-4 py-4 font-medium text-gray-700 dark:text-white">
                    {mediaFieldLabel}
                  </th>
                  <th className="px-4 py-4 font-medium text-gray-700 dark:text-white">
                    Mo ta
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
                {items.map((item) => (
                  <tr key={item._id}>
                    <td className="border-b border-gray-100 px-4 py-5 dark:border-gray-800">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white/90">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {item._id}
                        </p>
                      </div>
                    </td>
                    <td className="border-b border-gray-100 px-4 py-5 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-300">
                      {item[mediaFieldKey] ? (
                        <a
                          href={item[mediaFieldKey]}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          Xem file
                        </a>
                      ) : (
                        "Chua co"
                      )}
                    </td>
                    <td className="border-b border-gray-100 px-4 py-5 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-300">
                      {item.description || "Khong co mo ta"}
                    </td>
                    <td className="border-b border-gray-100 px-4 py-5 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-300">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("vi-VN")
                        : "--"}
                    </td>
                    <td className="border-b border-gray-100 px-4 py-5 dark:border-gray-800">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-300"
                        >
                          Sua
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:bg-red-950/20 dark:text-red-300"
                        >
                          Xoa
                        </button>
                      </div>
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
