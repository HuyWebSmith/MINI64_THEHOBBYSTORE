import { useContext, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import type { CartData } from "../types/shop";
import {
  apiUrl,
  dispatchCartChanged,
  formatCurrency,
  getAuthHeaders,
} from "../utils/shop";

type CheckoutForm = {
  fullName: string;
  phone: string;
  address: string;
  note: string;
};

type OrderSuccess = {
  _id: string;
  totalPrice: number;
};

const CheckoutPage = () => {
  const { user } = useContext(UserContext);
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState<OrderSuccess | null>(null);
  const [form, setForm] = useState<CheckoutForm>({
    fullName: user?.name ?? "",
    phone: "",
    address: "",
    note: "",
  });
  const navigate = useNavigate();

  const fetchCart = async () => {
    const headers = getAuthHeaders();

    if (!headers) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/api/cart/me`, { headers });
      setCart(response.data?.data ?? null);
    } catch (err) {
      console.error(err);
      setError("Khong the tai gio hang de thanh toan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const total = useMemo(
    () =>
      (cart?.items ?? []).reduce(
        (sum, item) => sum + item.priceAtAdd * item.quantity,
        0,
      ),
    [cart],
  );

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const headers = getAuthHeaders();

    if (!headers) {
      navigate("/login");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const response = await axios.post(`${apiUrl}/api/order/create-cod`, form, {
        headers,
      });

      if (response.data?.status === "OK") {
        setOrderSuccess(response.data?.data);
        setCart((prev) => (prev ? { ...prev, items: [] } : prev));
        dispatchCartChanged();
      } else {
        setError(response.data?.message ?? "Khong the tao don hang.");
      }
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Khong the thanh toan COD luc nay.";
      console.error(err);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen bg-slate-100 px-5 pb-20 pt-32 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-purple-500">
            Checkout
          </p>
          <h1 className="mt-3 text-4xl font-black text-slate-900">
            Thanh toan don hang
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Hoan tat thong tin giao hang, he thong se tao don COD va xoa gio hang
            sau khi dat thanh cong.
          </p>
        </div>

        {!getAuthHeaders() ? (
          <div className="mt-10 rounded-[32px] bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">
              Hay dang nhap de thanh toan
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
            Dang chuan bi don hang...
          </div>
        ) : orderSuccess ? (
          <div className="mt-10 rounded-[32px] bg-white p-10 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-green-100 p-3 text-green-600">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900">
                  Dat hang thanh cong
                </h2>
                <p className="mt-3 text-slate-600">
                  Don hang COD da duoc tao. Nhan vien se lien he voi ban som.
                </p>
                <p className="mt-4 text-sm text-slate-500">
                  Ma don: {orderSuccess._id}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Tong thanh toan: {formatCurrency(orderSuccess.totalPrice ?? 0)}
                </p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/"
                className="rounded-full bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700"
              >
                Ve trang chu
              </Link>
              <Link
                to="/wishlist"
                className="rounded-full border border-purple-500 px-6 py-3 font-semibold text-purple-600 transition hover:bg-purple-500 hover:text-white"
              >
                Xem wishlist
              </Link>
              <Link
                to="/orders"
                className="rounded-full border border-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-400"
              >
                Xem don hang
              </Link>
            </div>
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="mt-10 rounded-[32px] bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">
              Gio hang cua ban dang trong
            </h2>
            <Link
              to="/cart"
              className="mt-6 inline-flex rounded-full bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700"
            >
              Mo gio hang
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.8fr]">
            <form
              onSubmit={handleSubmit}
              className="rounded-[32px] bg-white p-8 shadow-sm"
            >
              <h2 className="text-2xl font-black text-slate-900">
                Thong tin giao hang
              </h2>
              <div className="mt-6 grid gap-5">
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Ho va ten"
                  className="rounded-2xl border border-slate-200 px-5 py-4 outline-none transition focus:border-purple-500"
                  required
                />
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="So dien thoai"
                  className="rounded-2xl border border-slate-200 px-5 py-4 outline-none transition focus:border-purple-500"
                  required
                />
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Dia chi nhan hang"
                  className="rounded-2xl border border-slate-200 px-5 py-4 outline-none transition focus:border-purple-500"
                  required
                />
                <textarea
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  placeholder="Ghi chu giao hang"
                  rows={5}
                  className="rounded-2xl border border-slate-200 px-5 py-4 outline-none transition focus:border-purple-500"
                />
              </div>

              {error && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full rounded-full bg-themeYellow px-6 py-4 font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Dang tao don hang..." : "Dat hang COD"}
              </button>
            </form>

            <aside className="rounded-[32px] bg-slate-900 p-8 text-white shadow-sm">
              <h2 className="text-2xl font-black">Tom tat don hang</h2>
              <div className="mt-6 space-y-4">
                {cart.items.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center gap-4 rounded-[24px] bg-white/5 p-4"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-20 w-20 rounded-2xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{item.name}</p>
                      <p className="mt-1 text-sm text-white/70">
                        {item.quantity} x {formatCurrency(item.priceAtAdd)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-white/10 pt-6">
                <div className="flex items-center justify-between text-white/70">
                  <span>Tam tinh</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-white/70">
                  <span>Van chuyen</span>
                  <span>Mien phi</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-lg font-bold">
                  <span>Tong thanh toan</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
};

export default CheckoutPage;
