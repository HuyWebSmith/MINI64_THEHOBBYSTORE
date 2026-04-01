import { useEffect, useState } from "react";
import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

interface ProductRecord {
  _id: string;
  image: string;
  model3dUrl?: string;
  model3dStatus?: "idle" | "processing" | "ready" | "failed";
  model3dJobId?: string;
  model3dError?: string;
  name: string;
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

interface ProductTableProps {
  refreshKey?: number;
  onEdit?: (product: ProductRecord) => void;
}

const isCloudinaryUrl = (value: string) => value.includes("res.cloudinary.com");

const statusStyles: Record<string, string> = {
  idle: "bg-gray-100 text-gray-600",
  processing: "bg-amber-50 text-amber-600",
  ready: "bg-emerald-50 text-emerald-600",
  failed: "bg-rose-50 text-rose-600",
};

const ProductTable = ({ refreshKey = 0, onEdit }: ProductTableProps) => {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [workingProductId, setWorkingProductId] = useState<string | null>(null);

  const accessToken = localStorage.getItem("access_token");

  const showMessage = (message: string) => {
    setActionMessage(message);
    window.setTimeout(() => setActionMessage(""), 3000);
  };

  const handleUnauthorized = (message?: string) => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_info");
    window.dispatchEvent(new Event("auth-changed"));
    setError(
      message || "Phien dang nhap da het han. Hay dang nhap lai bang tai khoan admin.",
    );
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${apiUrl}/api/product/get-all`, {
        params: { limit: 100, page: 0 },
      });

      setProducts(response.data?.data ?? []);
    } catch (err) {
      setError("Khong the tai danh sach san pham tu database.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [refreshKey]);

  const updateProductInState = (updatedProduct: ProductRecord) => {
    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product._id === updatedProduct._id ? updatedProduct : product,
      ),
    );
  };

  const handleDelete = async (id: string) => {
    if (!accessToken) {
      setError("Ban can dang nhap tai khoan admin de xoa san pham.");
      return;
    }

    if (!window.confirm("Ban co chac chan muon xoa san pham nay?")) {
      return;
    }

    try {
      await axios.delete(`${apiUrl}/api/product/delete/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setProducts((currentProducts) =>
        currentProducts.filter((product) => product._id !== id),
      );
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        handleUnauthorized(err.response?.data?.message);
      } else {
        setError("Xoa san pham that bai. Vui long kiem tra quyen admin.");
      }
    }
  };

  const handleGenerate3D = async (productId: string) => {
    if (!accessToken) {
      setError("Ban can dang nhap tai khoan admin de tao 3D.");
      return;
    }

    try {
      setWorkingProductId(productId);
      const response = await axios.post(
        `${apiUrl}/api/product/generate-3d/${productId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.data?.status !== "OK") {
        setError(response.data?.message ?? "Khong the tao job 3D.");
        return;
      }

      updateProductInState(response.data.data);
      showMessage("Da tao job 3D cho san pham.");
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          handleUnauthorized(err.response?.data?.message);
          return;
        }
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Tao job 3D that bai.",
        );
      } else {
        setError("Tao job 3D that bai.");
      }
    } finally {
      setWorkingProductId(null);
    }
  };

  const handleUploadCloudinary = async (productId: string) => {
    if (!accessToken) {
      setError("Ban can dang nhap tai khoan admin de dong bo anh len Cloudinary.");
      return;
    }

    try {
      setWorkingProductId(productId);
      const response = await axios.post(
        `${apiUrl}/api/product/upload-cloudinary/${productId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.data?.status !== "OK") {
        setError(response.data?.message ?? "Khong the tai anh len Cloudinary.");
        return;
      }

      updateProductInState(response.data.data);
      showMessage("Da tai anh san pham len Cloudinary.");
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          handleUnauthorized(err.response?.data?.message);
          return;
        }
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Tai anh len Cloudinary that bai.",
        );
      } else {
        setError("Tai anh len Cloudinary that bai.");
      }
    } finally {
      setWorkingProductId(null);
    }
  };

  const handleSync3D = async (productId: string) => {
    if (!accessToken) {
      setError("Ban can dang nhap tai khoan admin de dong bo 3D.");
      return;
    }

    try {
      setWorkingProductId(productId);
      const response = await axios.post(
        `${apiUrl}/api/product/sync-3d/${productId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.data?.status !== "OK") {
        setError(response.data?.message ?? "Khong the dong bo 3D.");
        return;
      }

      updateProductInState(response.data.data);
      showMessage(response.data?.message ?? "Da dong bo 3D.");
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          handleUnauthorized(err.response?.data?.message);
          return;
        }
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Dong bo 3D that bai.",
        );
      } else {
        setError("Dong bo 3D that bai.");
      }
    } finally {
      setWorkingProductId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
        Dang dong bo san pham tu database...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 dark:bg-white/[0.03]">
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
            {products.length} san pham dang duoc dong bo
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Du lieu duoc lay truc tiep tu MongoDB qua API admin.
          </p>
        </div>
        <button
          onClick={fetchProducts}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-indigo-500 hover:text-indigo-600 dark:border-gray-700 dark:text-gray-200"
        >
          Lam moi
        </button>
      </div>

      {actionMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {actionMessage}
        </div>
      )}

      {error && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            {error}
          </div>
          <button
            onClick={fetchProducts}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900"
          >
            Thu tai lai
          </button>
        </div>
      )}

      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[1100px] table-auto">
          <thead>
            <tr className="bg-gray-100 text-left dark:bg-white/[0.05]">
              <th className="px-4 py-4 font-medium text-gray-700 dark:text-white xl:pl-6">
                San pham
              </th>
              <th className="px-4 py-4 font-medium text-gray-700 dark:text-white">
                Danh muc
              </th>
              <th className="px-4 py-4 font-medium text-gray-700 dark:text-white">
                Thuong hieu
              </th>
              <th className="px-4 py-4 font-medium text-gray-700 dark:text-white">
                Gia
              </th>
              <th className="px-4 py-4 font-medium text-gray-700 dark:text-white">
                Ton kho
              </th>
              <th className="px-4 py-4 font-medium text-gray-700 dark:text-white">
                Rating
              </th>
              <th className="px-4 py-4 font-medium text-gray-700 dark:text-white">
                3D
              </th>
              <th className="px-4 py-4 text-right font-medium text-gray-700 dark:text-white">
                Thao tac
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const status = product.model3dStatus || "idle";
              const isWorking = workingProductId === product._id;

              return (
                <tr key={product._id}>
                  <td className="border-b border-gray-100 px-4 py-5 dark:border-gray-800 xl:pl-6">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white/90">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {product._id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="border-b border-gray-100 px-4 py-5 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-300">
                    {product.category?.name ?? "Chua gan"}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-5 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-300">
                    {product.brand?.name ?? "Chua gan"}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-5 text-sm font-semibold text-gray-900 dark:border-gray-800 dark:text-white/90">
                    {product.price.toLocaleString("vi-VN")}đ
                  </td>
                  <td className="border-b border-gray-100 px-4 py-5 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-300">
                    {product.stock}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-5 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-300">
                    {product.rating}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-5 text-sm dark:border-gray-800">
                    <div className="space-y-2">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
                      >
                        {status}
                      </span>
                      {product.model3dUrl && (
                        <p className="text-xs text-emerald-600">Da co model</p>
                      )}
                      {isCloudinaryUrl(product.image) && (
                        <p className="text-xs text-sky-600">Anh tren Cloudinary</p>
                      )}
                      {product.model3dError && (
                        <p className="max-w-[180px] text-xs text-rose-600">
                          {product.model3dError}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="border-b border-gray-100 px-4 py-5 text-right dark:border-gray-800">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        onClick={() => onEdit?.(product)}
                        className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-300"
                      >
                        Sua
                      </button>
                      {!isCloudinaryUrl(product.image) && (
                        <button
                          onClick={() => handleUploadCloudinary(product._id)}
                          disabled={isWorking}
                          className="rounded-lg bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-50"
                        >
                          Len Cloud
                        </button>
                      )}
                      <button
                        onClick={() => handleGenerate3D(product._id)}
                        disabled={isWorking}
                        className="rounded-lg bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-600 transition hover:bg-violet-100 disabled:opacity-50"
                      >
                        Tao 3D
                      </button>
                      <button
                        onClick={() => handleSync3D(product._id)}
                        disabled={isWorking || !product.model3dJobId}
                        className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                      >
                        Dong bo
                      </button>
                      {product.model3dUrl && (
                        <a
                          href={product.model3dUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          Mo 3D
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:bg-red-950/20 dark:text-red-300"
                      >
                        Xoa
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTable;
