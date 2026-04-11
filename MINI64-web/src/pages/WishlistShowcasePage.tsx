import { useContext } from "react";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, ShoppingCart, Trash2, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { UserContext } from "../context/UserContext";

const formatCurrency = (price: number) => `${price.toLocaleString("vi-VN")}đ`;

export default function WishlistShowcasePage() {
  const { user } = useContext(UserContext);
  const { wishlistItems, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-28 dark:bg-gray-950">
        <section className="mx-auto max-w-4xl px-5 pb-20 lg:px-8">
          <div className="rounded-[36px] border border-dashed border-gray-200 bg-white px-6 py-16 text-center shadow-sm dark:border-white/10 dark:bg-gray-900">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-300">
              <Heart className="h-9 w-9" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
              Vui lòng đăng nhập để xem wishlist
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-gray-500 dark:text-gray-400">
              Đăng nhập để lưu và quản lý các mẫu xe bạn đã thả tim.
            </p>
            <Link
              to="/login"
              className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-indigo-500"
            >
              Đăng nhập
              <ShoppingCart className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const handleQuickAdd = (item: (typeof wishlistItems)[number]) => {
    if (item.product.stock <= 0) {
      toast.error("Sản phẩm này hiện đã hết hàng.");
      return;
    }

    addToCart({
      productId: item.product._id,
      name: item.product.name,
      image: item.product.image,
      price: item.product.price,
      amount: 1,
      scale: "1:64",
      brand: "Mini64",
      stock: Math.max(1, item.product.stock),
    });

    window.dispatchEvent(new Event("mini64:cart-open"));
    toast.success("Đã thêm sản phẩm vào giỏ hàng.");
  };

  const handleRemove = async (productId: string) => {
    try {
      await toggleWishlist(productId);
      toast.success("Đã xóa khỏi danh sách yêu thích.");
    } catch (error) {
      console.error(error);
      toast.error("Không thể xóa sản phẩm khỏi wishlist.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-28 dark:bg-gray-950">
      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        <div className="rounded-[36px] border border-gray-100 bg-gradient-to-br from-white via-white to-rose-50 p-6 shadow-sm dark:border-white/10 dark:from-gray-900 dark:via-gray-900 dark:to-rose-950/20 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-300">
                <Heart className="h-6 w-6 fill-current" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-500">
                  Wishlist
                </p>
                <h1 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                  Bộ sưu tập xe yêu thích của bạn
                </h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Những mẫu xe bạn đã thả tim sẽ xuất hiện ở đây ngay lập tức.
                </p>
              </div>
            </div>

            <div className="rounded-[24px] bg-white px-5 py-4 shadow-sm dark:bg-gray-900/70">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
                Tổng wishlist items
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {wishlistItems.length}
              </p>
            </div>
          </div>

          <div className="mt-10">
            {wishlistItems.length > 0 ? (
              <motion.div layout className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {wishlistItems.map((item) => {
                  const inStock = item.product.stock > 0;

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.92, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0, y: 16 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                      key={item.product._id}
                      className="group overflow-hidden rounded-[30px] border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-gray-900"
                    >
                      <Link
                        to={`/products/${item.product._id}`}
                        className="relative block overflow-hidden bg-gray-100 dark:bg-white/[0.04]"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                        <span
                          className={`absolute left-4 top-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            inStock
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                              : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                          }`}
                        >
                          {inStock ? "Còn hàng" : "Hết hàng"}
                        </span>
                      </Link>

                      <div className="space-y-4 p-5">
                        <div>
                          <Link
                            to={`/products/${item.product._id}`}
                            className="line-clamp-2 text-xl font-bold text-gray-900 transition hover:text-indigo-600 dark:text-white dark:hover:text-indigo-300"
                          >
                            {item.product.name}
                          </Link>
                          <p className="mt-2 text-lg font-bold text-indigo-600 dark:text-indigo-300">
                            {formatCurrency(item.product.price)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Truck className="h-4 w-4" />
                          {inStock
                            ? `Sẵn sàng giao với ${item.product.stock} mẫu còn lại`
                            : "Tạm thời chưa có hàng trong kho"}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => handleQuickAdd(item)}
                            disabled={!inStock}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-white/10 dark:disabled:text-gray-500"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            Thêm vào giỏ
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleRemove(item.product._id)}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-white/10 dark:text-gray-200 dark:hover:border-rose-500/20 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                          >
                            <Trash2 className="h-4 w-4" />
                            Xóa khỏi danh sách
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="rounded-[32px] border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-300">
                  <Heart className="h-10 w-10" />
                </div>
                <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
                  Bạn chưa có mẫu xe nào trong danh sách yêu thích
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-gray-500 dark:text-gray-400">
                  Hãy tiếp tục khám phá các mẫu Mini64, Mini GT và Tarmac yêu thích.
                  Khi bạn bấm vào biểu tượng trái tim ở trang chủ hoặc trang shop,
                  sản phẩm sẽ tự động xuất hiện ở đây mà không cần tải lại trang.
                </p>
                <Link
                  to="/shop"
                  className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-indigo-500"
                >
                  Tiếp tục mua sắm
                  <ShoppingCart className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
