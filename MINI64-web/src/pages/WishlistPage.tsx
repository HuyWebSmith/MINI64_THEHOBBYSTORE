import { useEffect, useState } from "react";
import axios from "axios";
import { Heart, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { ProductItem } from "../types/shop";
import {
  apiUrl,
  dispatchCartChanged,
  dispatchWishlistChanged,
  formatCurrency,
  getAuthHeaders,
} from "../utils/shop";

const WishlistPage = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const showMessage = (value: string) => {
    setMessage(value);
    window.setTimeout(() => setMessage(""), 2500);
  };

  const fetchWishlist = async () => {
    const headers = getAuthHeaders();

    if (!headers) {
      setLoading(false);
      setProducts([]);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${apiUrl}/api/user/wishlist`, { headers });
      setProducts(response.data?.data ?? []);
    } catch (err) {
      console.error(err);
      setError("Khong the tai danh sach yeu thich.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWishlist = async (productId: string) => {
    const headers = getAuthHeaders();

    if (!headers) {
      navigate("/login");
      return;
    }

    try {
      const response = await axios.post(
        `${apiUrl}/api/user/wishlist/toggle`,
        { productId },
        { headers },
      );

      if (response.data?.status !== "OK") {
        setError(response.data?.message ?? "Khong the cap nhat yeu thich luc nay.");
        return;
      }

      setProducts(response.data?.data ?? []);
      showMessage("Da cap nhat danh sach yeu thich.");
      dispatchWishlistChanged();
    } catch (err) {
      console.error(err);
      setError("Khong the cap nhat yeu thich luc nay.");
    }
  };

  const handleAddToCart = async (productId: string) => {
    const headers = getAuthHeaders();

    if (!headers) {
      navigate("/login");
      return;
    }

    try {
      const response = await axios.post(
        `${apiUrl}/api/cart/add`,
        { productId, quantity: 1 },
        { headers },
      );

      if (response.data?.status !== "OK") {
        setError(response.data?.message ?? "Khong the them vao gio hang.");
        return;
      }

      showMessage("Da them san pham vao gio hang.");
      dispatchCartChanged();
    } catch (err) {
      console.error(err);
      setError("Khong the them vao gio hang.");
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  return (
    <section className="min-h-screen bg-slate-100 px-5 pb-20 pt-32 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-purple-500">
              Wishlist
            </p>
            <h1 className="mt-3 text-4xl font-black text-slate-900">
              San pham ban muon mua sau
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Luu lai cac mau xe va phu kien yeu thich, sau do them vao gio hang
              bat cu luc nao.
            </p>
          </div>
          <Link
            to="/cart"
            className="rounded-full bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700"
          >
            Mo gio hang
          </Link>
        </div>

        {message && (
          <div className="mt-6 rounded-2xl border border-purple-200 bg-white px-5 py-4 text-sm font-semibold text-purple-600">
            {message}
          </div>
        )}

        {!getAuthHeaders() ? (
          <div className="mt-10 rounded-[32px] bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">
              Hay dang nhap de xem wishlist
            </h2>
            <p className="mt-3 text-slate-600">
              Sau khi dang nhap, ban co the luu san pham yeu thich va mua sau.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex rounded-full bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700"
            >
              Dang nhap
            </Link>
          </div>
        ) : loading ? (
          <div className="mt-10 rounded-[32px] bg-white p-10 text-center text-slate-500 shadow-sm">
            Dang tai wishlist...
          </div>
        ) : error ? (
          <div className="mt-10 rounded-[32px] border border-red-200 bg-red-50 p-10 text-center text-red-600">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="mt-10 rounded-[32px] bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">
              Wishlist dang trong
            </h2>
            <p className="mt-3 text-slate-600">
              Quay lai trang chu va bam tim tren san pham ban thich.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex rounded-full border border-purple-500 px-6 py-3 font-semibold text-purple-600 transition hover:bg-purple-500 hover:text-white"
            >
              Kham pha san pham
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <article
                key={product._id}
                className="rounded-[30px] bg-white p-5 shadow-sm"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-64 w-full rounded-[22px] object-cover"
                />
                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {product.category?.name ?? "Danh muc"}
                    </p>
                    <h2 className="mt-2 text-xl font-black text-slate-900">
                      {product.name}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleWishlist(product._id)}
                    className="rounded-full bg-rose-50 p-3 text-rose-500 transition hover:bg-rose-100"
                  >
                    <Heart className="fill-current" size={18} />
                  </button>
                </div>
                <p className="mt-3 text-lg font-bold text-purple-600">
                  {formatCurrency(product.price)}
                </p>
                <p className="mt-3 max-h-[4.5rem] overflow-hidden text-sm leading-6 text-slate-600">
                  {product.description ??
                    "San pham da duoc luu trong danh sach yeu thich."}
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product._id)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-purple-600 px-5 py-3 font-semibold text-white transition hover:bg-purple-700"
                  >
                    <ShoppingCart size={18} />
                    Them vao gio
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleWishlist(product._id)}
                    className="rounded-full border border-slate-200 px-5 py-3 font-semibold text-slate-600 transition hover:border-slate-400"
                  >
                    Xoa
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default WishlistPage;
