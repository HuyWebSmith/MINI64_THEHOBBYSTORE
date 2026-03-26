import { useEffect, useState } from "react";
import axios from "axios";
import PageBreadcrumb from "../../components/admin_component/common/PageBreadCrumb";
import ComponentCard from "../../components/admin_component/common/ComponentCard";
import PageMeta from "../../components/admin_component/common/PageMeta";
import ProductTable from "../../components/admin_component/products/ProductTable";

const apiUrl = import.meta.env.VITE_API_URL;

interface OptionItem {
  _id: string;
  name: string;
}

interface ProductFormData {
  name: string;
  image: string;
  price: string;
  stock: string;
  rating: string;
  description: string;
  category: string;
  brand: string;
}

interface EditableProduct {
  _id: string;
  name: string;
  image: string;
  price: number;
  stock: number;
  rating: number;
  description: string;
  category?: {
    _id: string;
    name: string;
  } | null;
  brand?: {
    _id: string;
    name: string;
  } | null;
}

const initialFormData: ProductFormData = {
  name: "",
  image: "",
  price: "",
  stock: "0",
  rating: "5",
  description: "",
  category: "",
  brand: "",
};

export default function ProductManagement() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [categories, setCategories] = useState<OptionItem[]>([]);
  const [brands, setBrands] = useState<OptionItem[]>([]);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  useEffect(() => {
    if (!showAddForm) {
      return;
    }

    const fetchOptions = async () => {
      try {
        setLoadingOptions(true);
        setError("");

        const [categoryResponse, brandResponse] = await Promise.all([
          axios.get(`${apiUrl}/api/category/get-all`),
          axios.get(`${apiUrl}/api/brand/get-all`, {
            params: { limit: 100, page: 0 },
          }),
        ]);

        setCategories(categoryResponse.data?.data ?? []);
        setBrands(brandResponse.data?.data ?? []);
      } catch (err) {
        setError("Khong the tai danh muc hoac thuong hieu tu database.");
        console.error(err);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [showAddForm]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingProductId(null);
    setError("");
  };

  const handleEditProduct = (product: EditableProduct) => {
    setShowAddForm(true);
    setEditingProductId(product._id);
    setSuccessMessage("");
    setError("");
    setFormData({
      name: product.name,
      image: product.image,
      price: String(product.price),
      stock: String(product.stock),
      rating: String(product.rating),
      description: product.description,
      category: product.category?._id ?? "",
      brand: product.brand?._id ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      setError(
        `Ban can dang nhap tai khoan admin de ${editingProductId ? "cap nhat" : "them"} san pham.`,
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      const payload = {
        name: formData.name,
        image: formData.image,
        price: Number(formData.price),
        stock: Number(formData.stock),
        rating: Number(formData.rating),
        description: formData.description,
        category: formData.category,
        brand: formData.brand,
      };

      if (editingProductId) {
        await axios.put(
          `${apiUrl}/api/product/update/${editingProductId}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
        setSuccessMessage("Cap nhat san pham thanh cong.");
      } else {
        await axios.post(`${apiUrl}/api/product/create`, payload, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setSuccessMessage("Them san pham thanh cong.");
      }

      setRefreshKey((currentKey) => currentKey + 1);
      resetForm();
      setShowAddForm(false);
    } catch (err) {
      setError(
        `${editingProductId ? "Cap nhat" : "Them"} san pham that bai. Vui long kiem tra du lieu va quyen admin.`,
      );
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Quan ly san pham | Mini64 Hobby Store"
        description="Trang quan ly san pham cho Admin"
      />
      <PageBreadcrumb pageTitle="Product Management" />

      <div className="space-y-6">
        <ComponentCard
          title="Danh sach san pham"
          desc="Dong bo du lieu san pham tu database va quan ly thao tac admin."
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Ban co the them san pham moi va bang duoi se cap nhat ngay sau khi luu.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddForm((currentState) => !currentState);
                  if (showAddForm) {
                    resetForm();
                  }
                  setError("");
                  setSuccessMessage("");
                }}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                {showAddForm ? "Dong form" : "Them san pham"}
              </button>
            </div>

            {successMessage && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                {successMessage}
              </div>
            )}

            {showAddForm && (
              <form
                onSubmit={handleSubmit}
                className="grid gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-white/[0.03] md:grid-cols-2"
              >
                <div className="md:col-span-2">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white/90">
                    {editingProductId ? "Cap nhat san pham" : "Them san pham moi"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {editingProductId
                      ? "Chinh sua thong tin san pham va luu lai vao database."
                      : "Dien day du thong tin de luu san pham vao database."}
                  </p>
                </div>

                {error && (
                  <div className="md:col-span-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                    {error}
                  </div>
                )}

                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ten san pham
                  </span>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Link hinh anh
                  </span>
                  <input
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    required
                    placeholder="https://..."
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Gia
                  </span>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ton kho
                  </span>
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Rating
                  </span>
                  <input
                    name="rating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.rating}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Danh muc
                  </span>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    disabled={loadingOptions}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="">Chon danh muc</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Thuong hieu
                  </span>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    required
                    disabled={loadingOptions}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="">Chon thuong hieu</option>
                    {brands.map((brand) => (
                      <option key={brand._id} value={brand._id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mo ta
                  </span>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </label>

                <div className="md:col-span-2 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowAddForm(false);
                    }}
                    className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-400 dark:border-gray-700 dark:text-gray-200"
                  >
                    Huy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || loadingOptions}
                    className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting
                      ? "Dang luu..."
                      : editingProductId
                        ? "Cap nhat san pham"
                        : "Luu san pham"}
                  </button>
                </div>
              </form>
            )}

            <ProductTable
              refreshKey={refreshKey}
              onEdit={handleEditProduct}
            />
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
