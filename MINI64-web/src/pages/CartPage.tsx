import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartData, CartItem } from "../types/shop";
import {
  apiUrl,
  dispatchCartChanged,
  formatCurrency,
  getAuthHeaders,
} from "../utils/shop";

const CartPage = () => {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchCart = async () => {
    const headers = getAuthHeaders();

    if (!headers) {
      setLoading(false);
      setCart(null);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${apiUrl}/api/cart/me`, { headers });
      setCart(response.data?.data ?? null);
    } catch (err) {
      console.error(err);
      setError("Khong the tai gio hang.");
    } finally {
      setLoading(false);
    }
  };

  const updateItemQuantity = async (item: CartItem, nextQuantity: number) => {
    const headers = getAuthHeaders();

    if (!headers) {
      navigate("/login");
      return;
    }

    try {
      const response = await axios.put(
        `${apiUrl}/api/cart/item/${item._id}`,
        { quantity: nextQuantity },
        { headers },
      );

      if (response.data?.status !== "OK") {
        setError(response.data?.message ?? "Khong the cap nhat gio hang.");
        return;
      }

      setCart(response.data?.data ?? null);
      dispatchCartChanged();
    } catch (err) {
      console.error(err);
      setError("Khong the cap nhat gio hang.");
    }
  };

  const deleteItem = async (itemId: string) => {
    const headers = getAuthHeaders();

    if (!headers) {
      navigate("/login");
      return;
    }

    try {
      const response = await axios.delete(`${apiUrl}/api/cart/item/${itemId}`, {
        headers,
      });

      if (response.data?.status !== "OK") {
        setError(response.data?.message ?? "Khong the xoa san pham khoi gio hang.");
        return;
      }

      setCart(response.data?.data ?? null);
      dispatchCartChanged();
    } catch (err) {
      console.error(err);
      setError("Khong the xoa san pham khoi gio hang.");
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const subtotal = useMemo(
    () =>
      (cart?.items ?? []).reduce(
        (sum, item) => sum + item.priceAtAdd * item.quantity,
        0,
      ),
    [cart],
  );

  return (
    <section className="min-h-screen bg-slate-100 px-5 pb-20 pt-32 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-purple-500">
              Cart
            </p>
            <h1 className="mt-3 text-4xl font-black text-slate-900">
              Gio hang cua ban
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Kiem tra lai so luong, tong tien va san sang chuyen sang thanh toan COD.
            </p>
          </div>
          <Link
            to="/wishlist"
            className="rounded-full border border-purple-500 px-6 py-3 font-semibold text-purple-600 transition hover:bg-purple-500 hover:text-white"
          >
            Mo wishlist
          </Link>
        </div>

        {!getAuthHeaders() ? (
          <div className="mt-10 rounded-[32px] bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">
              Hay dang nhap de xem gio hang
            </h2>
            <Link
              to="/login"
              className="mt-6 inline-flex rounded-full bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700"
            >
              Dang nhap
            </Link>
          </div>
        ) : loading ? (
          <div className="mt-10 rounded-[32px] bg-white p-10 text-center text-slate-500 shadow-sm">
            Dang tai gio hang...
          </div>
        ) : error ? (
          <div className="mt-10 rounded-[32px] border border-red-200 bg-red-50 p-10 text-center text-red-600">
            {error}
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="mt-10 rounded-[32px] bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Gio hang dang trong</h2>
            <p className="mt-3 text-slate-600">
              Hay them san pham tu trang chu hoac wishlist.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex rounded-full bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700"
            >
              Tiep tuc mua sam
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-5">
              {cart.items.map((item) => (
                <article
                  key={item._id}
                  className="grid gap-5 rounded-[30px] bg-white p-5 shadow-sm md:grid-cols-[160px_1fr_auto]"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-40 w-full rounded-[22px] object-cover"
                  />
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">{item.name}</h2>
                    <p className="mt-3 text-lg font-bold text-purple-600">
                      {formatCurrency(item.priceAtAdd)}
                    </p>
                    <p className="mt-3 text-sm text-slate-500">
                      So luong hien tai: {item.quantity}
                    </p>
                  </div>
                  <div className="flex flex-col items-end justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => deleteItem(item._id)}
                      className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                      Xoa
                    </button>
                    <div className="flex items-center gap-3 rounded-full border border-slate-200 px-3 py-2">
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(item, item.quantity - 1)}
                        className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center text-lg font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(item, item.quantity + 1)}
                        className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className="rounded-[30px] bg-slate-900 p-7 text-white shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-themeYellow">
                Tong ket
              </p>
              <div className="mt-6 space-y-4 text-sm text-white/70">
                <div className="flex items-center justify-between">
                  <span>So san pham</span>
                  <span>{cart.items.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tam tinh</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Phi van chuyen</span>
                  <span>Mien phi</span>
                </div>
              </div>
              <div className="mt-6 border-t border-white/10 pt-6">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Tong cong</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/checkout")}
                className="mt-8 w-full rounded-full bg-themeYellow px-6 py-3 font-semibold text-black transition hover:opacity-90"
              >
                Thanh toan COD
              </button>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
};

export default CartPage;
