import { Heart, Bell, BellOff } from "lucide-react";
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";

const formatCurrency = (price: number) => `${price.toLocaleString("vi-VN")}đ`;

export default function WishlistPage() {
  const { wishlistItems, setNotifyOnSale } = useWishlist();

  return (
    <div className="min-h-screen bg-gray-50 pt-28 dark:bg-gray-950">
      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        <div className="rounded-[36px] border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-300">
              <Heart className="h-5 w-5 fill-current" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-500">
                Wishlist
              </p>
              <h1 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                Your Mini64 Watchlist
              </h1>
            </div>
          </div>

          <div className="mt-8">
            {wishlistItems.length > 0 ? (
              <div className="grid gap-5">
                {wishlistItems.map((item) => (
                  <div
                    key={item.product._id}
                    className="flex flex-col gap-5 rounded-[28px] border border-gray-100 bg-gray-50 p-5 dark:border-white/10 dark:bg-white/[0.03] md:flex-row md:items-center md:justify-between"
                  >
                    <Link
                      to={`/products/${item.product._id}`}
                      className="flex items-center gap-4"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-24 w-24 rounded-[22px] object-cover"
                      />
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          {item.product.name}
                        </h2>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          {formatCurrency(item.product.price)} • {item.product.stock} in
                          stock
                        </p>
                      </div>
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        void setNotifyOnSale(
                          item.product._id,
                          !item.notifyOnSale,
                        )
                      }
                      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        item.notifyOnSale
                          ? "bg-emerald-500 text-white hover:bg-emerald-400"
                          : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                      }`}
                    >
                      {item.notifyOnSale ? (
                        <Bell className="h-4 w-4" />
                      ) : (
                        <BellOff className="h-4 w-4" />
                      )}
                      {item.notifyOnSale
                        ? "Notify me when on sale"
                        : "Turn on sale alerts"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center text-sm text-gray-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400">
                Your wishlist is empty.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
