import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";

function formatCurrency(price: number) {
  return `${price.toLocaleString("vi-VN")}đ`;
}

function CartPage() {
  const navigate = useNavigate();
  const { cartItems, subtotal, updateQuantity, removeFromCart } = useCart();

  return (
    <div className="min-h-screen bg-gray-50 pt-28 text-gray-900 dark:bg-gray-950 dark:text-white">
      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        <div className="mb-8 rounded-[36px] border border-gray-100 bg-gradient-to-br from-white via-white to-indigo-50 p-6 shadow-sm dark:border-white/10 dark:from-gray-900 dark:via-gray-900 dark:to-brand-950 lg:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-indigo-600 dark:text-brand-400">
            Cart
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Giỏ hàng của bạn</h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="rounded-[36px] border border-dashed border-gray-300 bg-white px-6 py-20 text-center shadow-sm dark:border-white/10 dark:bg-gray-900">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
              Chưa có sản phẩm nào trong giỏ.
            </p>
            <Link
              to="/shop"
              className="mt-6 inline-flex rounded-2xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-themeYellow hover:text-black"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.productId}
                  className="rounded-[28px] border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900 sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-28 w-full rounded-[22px] object-cover sm:w-32"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <Link
                            to={`/products/${item.productId}`}
                            className="text-xl font-bold text-gray-900 transition hover:text-indigo-600 dark:text-white dark:hover:text-brand-400"
                          >
                            {item.name}
                          </Link>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {item.brand} • Tỷ lệ {item.scale}
                          </p>
                          <p className="mt-2 text-xl font-bold text-indigo-700 dark:text-brand-400">
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                          Xóa
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-4">
                        <div className="inline-flex h-12 items-center justify-between rounded-2xl border border-gray-200 bg-white px-2 shadow-sm dark:border-white/10 dark:bg-gray-950 sm:w-[160px]">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.productId, item.amount - 1)
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-600 transition hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-white/5"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="text-base font-bold">{item.amount}</span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.productId, item.amount + 1)
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-600 transition hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-white/5"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <p className="text-right text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(item.price * item.amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="h-fit rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900">
              <h2 className="text-2xl font-bold">Tóm tắt đơn hàng</h2>
              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                  <span>Tạm tính</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                  <span>Phí ship dự kiến</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    30.000đ
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-4 dark:border-white/10">
                  <div className="flex items-center justify-between text-base font-bold">
                    <span>Tổng cộng</span>
                    <span className="text-indigo-700 dark:text-brand-400">
                      {formatCurrency(subtotal + 30000)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/checkout")}
                className="mt-6 w-full rounded-2xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-themeYellow hover:text-black dark:bg-brand-500 dark:hover:bg-themeYellow dark:hover:text-black"
              >
                Tiến hành thanh toán COD
              </button>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}

export default CartPage;
