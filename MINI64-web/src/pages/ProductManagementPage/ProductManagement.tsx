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
  model3dUrl: string;
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
  model3dUrl?: string;
  price: number;
  stock: number;
  rating: number;
  description: string;
  category?: { _id: string; name: string } | null;
  brand?: { _id: string; name: string } | null;
}

const initialFormData: ProductFormData = {
  name: "",
  image: "",
  model3dUrl: "",
  price: "",
  stock: "0",
  rating: "5",
  description: "",
  category: "",
  brand: "",
};

export default function ProductManagement() {
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState<OptionItem[]>([]);
  const [brands, setBrands] = useState<OptionItem[]>([]);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Lấy danh mục và thương hiệu khi mở Modal
  useEffect(() => {
    if (!showModal) return;

    const fetchOptions = async () => {
      try {
        setLoadingOptions(true);
        const [categoryResponse, brandResponse] = await Promise.all([
          axios.get(`${apiUrl}/api/category/get-all`),
          axios.get(`${apiUrl}/api/brand/get-all`, {
            params: { limit: 100, page: 0 },
          }),
        ]);
        setCategories(categoryResponse.data?.data ?? []);
        setBrands(brandResponse.data?.data ?? []);
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        setError("Không thể tải danh mục hoặc thương hiệu.");
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, [showModal]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData(initialFormData);
    setEditingProductId(null);
    setError("");
  };

  const handleEditProduct = (product: EditableProduct) => {
    setEditingProductId(product._id);
    setFormData({
      name: product.name,
      image: product.image,
      model3dUrl: product.model3dUrl ?? "",
      price: String(product.price),
      stock: String(product.stock),
      rating: String(product.rating),
      description: product.description,
      category: product.category?._id ?? "",
      brand: product.brand?._id ?? "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      setError("Bạn cần đăng nhập quyền Admin.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const payload = {
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock),
        rating: Number(formData.rating),
      };

      if (editingProductId) {
        await axios.put(
          `${apiUrl}/api/product/update/${editingProductId}`,
          payload,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        setSuccessMessage("Cập nhật sản phẩm thành công!");
      } else {
        await axios.post(`${apiUrl}/api/product/create`, payload, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setSuccessMessage("Thêm sản phẩm thành công!");
      }

      setRefreshKey((prev) => prev + 1);
      closeModal();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Có lỗi xảy ra từ máy chủ.");
      } else {
        setError("Có lỗi không xác định xảy ra.");
      }
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Quản lý sản phẩm | Mini64 Hobby Store"
        description="Trang quản lý sản phẩm Admin"
      />
      <PageBreadcrumb pageTitle="Quản lý sản phẩm" />

      <div className="space-y-6">
        <ComponentCard
          title="Danh sách sản phẩm mô hình"
          desc="Quản lý kho hàng, giá cả và thông tin chi tiết xe mô hình."
        >
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowModal(true)}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
              >
                + Thêm sản phẩm mới
              </button>
            </div>

            {successMessage && (
              <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700 border border-emerald-200">
                {successMessage}
              </div>
            )}

            {/* MODAL FORM */}
            {showModal && (
              <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900">
                  <div className="flex items-center justify-between border-b pb-4 mb-4 dark:border-gray-800">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {editingProductId
                        ? "Chỉnh sửa sản phẩm"
                        : "Thêm sản phẩm mô hình"}
                    </h3>
                    <button
                      onClick={closeModal}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>

                  {error && (
                    <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                      {error}
                    </div>
                  )}

                  {loadingOptions && (
                    <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-600 border border-blue-200">
                      Dang tai danh muc va thuong hieu...
                    </div>
                  )}

                  <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">
                        Tên sản phẩm (Xe + Tỷ lệ)
                      </label>
                      <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border p-2.5 dark:bg-gray-800 dark:border-gray-700"
                        placeholder="VD: Lamborghini Huracan STO 1:64"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Giá bán (VNĐ)
                      </label>
                      <input
                        name="price"
                        type="number"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border p-2.5 dark:bg-gray-800 dark:border-gray-700"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Số lượng tồn kho
                      </label>
                      <input
                        name="stock"
                        type="number"
                        value={formData.stock}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border p-2.5 dark:bg-gray-800 dark:border-gray-700"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">
                        Link hình ảnh sản phẩm
                      </label>
                      <input
                        name="image"
                        value={formData.image}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border p-2.5 dark:bg-gray-800 dark:border-gray-700"
                        placeholder="https://..."
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Neu anh dang o localhost, ban co the bam `Len Cloud` trong bang san pham de doi sang URL public tren Cloudinary truoc khi tao 3D.
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">
                        Link model 3D (.glb/.gltf) - tuy chon
                      </label>
                      <input
                        name="model3dUrl"
                        value={formData.model3dUrl}
                        onChange={handleChange}
                        className="w-full rounded-lg border p-2.5 dark:bg-gray-800 dark:border-gray-700"
                        placeholder="https://...model.glb"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Danh mục
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border p-2.5 dark:bg-gray-800 dark:border-gray-700"
                      >
                        <option value="">Chọn danh mục</option>
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Thương hiệu
                      </label>
                      <select
                        name="brand"
                        value={formData.brand}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border p-2.5 dark:bg-gray-800 dark:border-gray-700"
                      >
                        <option value="">Chọn hãng mô hình</option>
                        {brands.map((b) => (
                          <option key={b._id} value={b._id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">
                        Mô tả chi tiết sản phẩm
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows={3}
                        className="w-full rounded-lg border p-2.5 dark:bg-gray-800 dark:border-gray-700"
                        placeholder="Chất liệu, hãng sản xuất, tình trạng hộp..."
                      />
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-5 py-2 text-sm font-semibold border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {submitting
                          ? "Đang lưu..."
                          : editingProductId
                            ? "Cập nhật ngay"
                            : "Thêm vào kho"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <ProductTable refreshKey={refreshKey} onEdit={handleEditProduct} />
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
