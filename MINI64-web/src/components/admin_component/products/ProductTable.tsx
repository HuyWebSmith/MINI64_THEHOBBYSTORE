import { useEffect, useState } from "react";
import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

interface ProductRecord {
  _id: string;
  image: string;
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

const ProductTable = ({ refreshKey = 0, onEdit }: ProductTableProps) => {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const handleDelete = async (id: string) => {
    const accessToken = localStorage.getItem("access_token");

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
      setError("Xoa san pham that bai. Vui long kiem tra quyen admin.");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
        Dang dong bo san pham tu database...
      </div>
    );
  }

  if (error) {
    return (
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

      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[860px] table-auto">
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
              <th className="px-4 py-4 text-right font-medium text-gray-700 dark:text-white">
                Thao tac
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
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
                <td className="border-b border-gray-100 px-4 py-5 text-right dark:border-gray-800">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit?.(product)}
                      className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-300"
                    >
                      Sua
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
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
    </div>
  );
};

export default ProductTable;
