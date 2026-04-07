import { useContext, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Truck } from "lucide-react";
import { useCart } from "../context/CartContext";
import { UserContext } from "../context/UserContext";

const apiUrl = import.meta.env.VITE_API_URL;
const shippingFee = 30000;

function formatCurrency(price: number) {
  return `${price.toLocaleString("vi-VN")}đ`;
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const { cartItems, subtotal, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fullName: user?.name ?? "",
    email: user?.email ?? "",
    phone: "",
    address: "",
    city: "",
  });

  const total = useMemo(() => subtotal + shippingFee, [subtotal]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (cartItems.length === 0) {
      setError("Giỏ hàng đang trống.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        orderItems: cartItems.map((item) => ({
          product: item.productId,
          amount: item.amount,
          scale: item.scale,
        })),
        shippingAddress: formData,
        paymentMethod: "COD",
        shippingPrice: shippingFee,
        taxPrice: 0,
        user: user?._id ?? null,
      };

      const response = await axios.post(`${apiUrl}/api/order/create`, payload);

      if (response.data?.status !== "OK") {
        throw new Error(response.data?.message || "Tạo đơn hàng thất bại");
      }

      clearCart();
      navigate("/order-success", {
        state: {
          orderId: response.data?.data?._id ?? null,
          email: formData.email,
        },
      });
    } catch (err) {
      console.error(err);
      setError("Không thể tạo đơn hàng COD. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-28 text-gray-900 dark:bg-gray-950 dark:text-white">
      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        <div className="mb-8 rounded-[36px] border border-gray-100 bg-gradient-to-br from-white via-white to-indigo-50 p-6 shadow-sm dark:border-white/10 dark:from-gray-900 dark:via-gray-900 dark:to-brand-950 lg:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-indigo-600 dark:text-brand-400">
            Checkout
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Thanh toán khi nhận hàng
          </h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900"
          >
            <h2 className="text-2xl font-bold">Thông tin nhận hàng</h2>

            {error ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                placeholder="Họ tên"
                className="h-14 rounded-2xl border border-gray-200 bg-gray-50 px-4 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-gray-950"
              />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="Email"
                className="h-14 rounded-2xl border border-gray-200 bg-gray-50 px-4 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-gray-950"
              />
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                placeholder="Số điện thoại"
                className="h-14 rounded-2xl border border-gray-200 bg-gray-50 px-4 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-gray-950 sm:col-span-2"
              />
              <input
                type="text"
                required
                value={formData.city}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    city: event.target.value,
                  }))
                }
                placeholder="Tỉnh / Thành phố"
                className="h-14 rounded-2xl border border-gray-200 bg-gray-50 px-4 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-gray-950 sm:col-span-2"
              />
              <textarea
                required
                value={formData.address}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    address: event.target.value,
                  }))
                }
                placeholder="Địa chỉ nhận hàng"
                rows={4}
                className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-gray-950 sm:col-span-2"
              />
            </div>

            <div className="mt-8 rounded-[24px] bg-gray-50 p-5 dark:bg-white/5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-brand-500/15 dark:text-brand-400">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    Phương thức thanh toán
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Thanh toán khi nhận hàng (COD)
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || cartItems.length === 0}
              className="mt-8 w-full rounded-2xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-themeYellow hover:text-black disabled:cursor-not-allowed disabled:opacity-60 dark:bg-brand-500 dark:hover:bg-themeYellow dark:hover:text-black"
            >
              {submitting ? "Đang xác nhận..." : "Xác nhận đặt hàng"}
            </button>
          </form>

          <aside className="h-fit rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900">
            <h2 className="text-2xl font-bold">Order Summary</h2>
            <div className="mt-6 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{item.name}</p>
                    <p className="text-gray-500 dark:text-gray-400">
                      {item.amount} x {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatCurrency(item.amount * item.price)}
                  </p>
                </div>
              ))}

              <div className="border-t border-gray-100 pt-4 text-sm dark:border-white/10">
                <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                  <span>Tạm tính</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-gray-500 dark:text-gray-400">
                  <span>Phí ship</span>
                  <span>{formatCurrency(shippingFee)}</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-base font-bold">
                  <span>Tổng tiền</span>
                  <span className="text-indigo-700 dark:text-brand-400">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

export default CheckoutPage;
