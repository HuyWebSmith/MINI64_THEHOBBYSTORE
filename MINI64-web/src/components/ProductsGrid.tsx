import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import { FaRegHeart, FaStar } from "react-icons/fa";
import { MdAddShoppingCart, MdOutlineRemoveRedEye } from "react-icons/md";
import { motion } from "framer-motion";
import axios from "axios";
import AOS from "aos";
import "aos/dist/aos.css";
import toast from "react-hot-toast";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

const apiUrl = import.meta.env.VITE_API_URL;

interface ProductItem {
  _id: string;
  name: string;
  image: string;
  price: number;
  rating: number;
  stock: number;
  category?: {
    _id: string;
    name: string;
  } | null;
  brand?: {
    _id: string;
    name: string;
  } | null;
}

const ProductsGrid = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
  const [poppingHeartId, setPoppingHeartId] = useState<string | null>(null);
  const { addToCart } = useCart();
  const { wishlistIds, toggleWishlist } = useWishlist();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${apiUrl}/api/product/get-all`, {
        params: {
          limit: 8,
          page: 0,
        },
      });

      setProducts(response.data?.data ?? []);
    } catch (err) {
      setError("Khong the tai san pham tu database.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: "ease-in-out",
      once: false,
    });

    fetchProducts();
  }, []);

  useEffect(() => {
    AOS.refresh();
  }, [products, loading]);

  const renderStars = (rating: number) => {
    const fullStars = Math.max(0, Math.min(5, Math.round(rating)));

    return Array.from({ length: 5 }, (_, index) => (
      <FaStar
        key={`${rating}-${index}`}
        className={index < fullStars ? "text-themepurple" : "text-gray-300"}
      />
    ));
  };

  const handleQuickAdd = (
    item: ProductItem,
    scale: string,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    if (item.stock <= 0) {
      toast.error("Sản phẩm này hiện đã hết hàng.");
      return;
    }

    const imageRect = event.currentTarget
      .closest("[data-product-card]")
      ?.querySelector("img")
      ?.getBoundingClientRect();

    addToCart({
      productId: item._id,
      name: item.name,
      image: item.image,
      price: item.price,
      amount: 1,
      scale,
      brand: item.brand?.name ?? "Mini64",
      stock: item.stock,
    });

    if (imageRect) {
      window.dispatchEvent(
        new CustomEvent("mini64:cart-fly", {
          detail: {
            image: item.image,
            startX: imageRect.left,
            startY: imageRect.top,
            width: imageRect.width,
            height: imageRect.height,
          },
        }),
      );
      return;
    }

    window.dispatchEvent(new Event("mini64:cart-open"));
  };

  const handleToggleWishlist = async (productId: string) => {
    setPoppingHeartId(productId);
    window.setTimeout(() => {
      setPoppingHeartId((current) => (current === productId ? null : current));
    }, 320);
    await toggleWishlist(productId);
  };

  return (
    <div
      id="products"
      className="w-full bg-gray-100 px-5 py-[80px] lg:px-20 flex flex-col items-center justify-center gap-4"
    >
      <h1
        data-aos="zoom-in"
        data-aos-delay="100"
        className="text-xl font-semibold text-themepurple"
      >
        Browse Collections
      </h1>
      <h1
        data-aos="zoom-in"
        data-aos-delay="200"
        className="text-center text-[42px] font-semibold leading-[50px] text-black"
      >
        Trending Products
      </h1>

      {loading ? (
        <div
          data-aos="zoom-in"
          data-aos-delay="300"
          className="mt-10 w-full rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center text-sm text-gray-500"
        >
          Dang tai san pham tu database...
        </div>
      ) : error ? (
        <div
          data-aos="zoom-in"
          data-aos-delay="300"
          className="mt-10 w-full rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center text-sm text-red-600"
        >
          <p>{error}</p>
          <button
            onClick={fetchProducts}
            className="mt-4 rounded-lg bg-themepurple px-5 py-2 font-semibold text-white transition hover:bg-themeYellow hover:text-black"
          >
            Thu tai lai
          </button>
        </div>
      ) : (
        <>
          <div
            data-aos="zoom-in"
            data-aos-delay="300"
            className="mt-10 grid w-full grid-cols-1 gap-10 lg:grid-cols-4"
          >
            {products.map((item) => (
              <div
                id="product-box"
                key={item._id}
                data-product-card
                onMouseEnter={() => setHoveredProductId(item._id)}
                onMouseLeave={() => setHoveredProductId(null)}
                className="relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative w-full overflow-hidden rounded-lg">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-[220px] w-full rounded-lg object-cover transition duration-500"
                  />
                  <motion.div
                    initial={false}
                    animate={{
                      opacity: hoveredProductId === item._id ? 1 : 0,
                      y: hoveredProductId === item._id ? 0 : 12,
                    }}
                    className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/20 bg-slate-950/70 p-3 backdrop-blur-xl"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                      Quick Add
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {["1:64", "1:43"].map((scale) => (
                        <button
                          key={`${item._id}-${scale}`}
                          type="button"
                          onClick={(event) => handleQuickAdd(item, scale, event)}
                          disabled={item.stock <= 0}
                          className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-400 hover:text-black disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/40"
                        >
                          {scale}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </div>
                <div
                  id="icons"
                  className="absolute top-[20px] flex items-center justify-center gap-3"
                >
                  <Link
                    to={`/products/${item._id}`}
                    aria-label={`Xem chi tiết ${item.name}`}
                    className="rounded-full bg-purple-500 p-3 text-white transition hover:bg-yellow-400 hover:text-black"
                  >
                    <MdOutlineRemoveRedEye />
                  </Link>
                  <motion.button
                    type="button"
                    onClick={() => void handleToggleWishlist(item._id)}
                    animate={
                      poppingHeartId === item._id
                        ? { scale: [1, 1.28, 0.92, 1] }
                        : { scale: 1 }
                    }
                    transition={{ duration: 0.32, ease: "easeOut" }}
                    className={`rounded-full p-3 transition ${
                      wishlistIds.includes(item._id)
                        ? "bg-rose-500 text-white"
                        : "bg-purple-500 text-white hover:bg-yellow-400 hover:text-black"
                    }`}
                  >
                    <FaRegHeart />
                  </motion.button>
                  <button
                    type="button"
                    onClick={(event) => handleQuickAdd(item, "1:64", event)}
                    disabled={item.stock <= 0}
                    className="rounded-full bg-purple-500 p-3 text-white hover:bg-yellow-400 hover:text-black disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                    aria-label={`Thêm ${item.name} vào giỏ`}
                  >
                    <MdAddShoppingCart />
                  </button>
                </div>
                <h1 className="text-lg font-semibold text-gray-400">
                  {item.category?.name ?? "Danh muc"}
                </h1>
                <h1 className="text-center text-xl font-semibold text-black">
                  {item.name}
                </h1>
                <h1 className="text-lg font-semibold text-themepurple">
                  {item.price.toLocaleString("vi-VN")}đ
                </h1>
                <div className="mt-2 w-full">
                  <hr />
                  <div className="mt-3 flex items-center justify-between gap-6">
                    <div className="flex items-center justify-start gap-1">
                      {renderStars(item.rating)}
                    </div>
                    <button className="rounded-lg bg-green-500 px-4 py-2 text-[13px] font-semibold text-white">
                      {item.stock > 0 ? `Con ${item.stock}` : "Het hang"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            data-aos="zoom-in"
            data-aos-delay="400"
            className="mt-8 rounded-lg bg-purple-500 px-8 py-3 font-semibold text-white hover:bg-yellow-500 hover:text-black"
          >
            VIEW MORE
          </button>
        </>
      )}
    </div>
  );
};

export default ProductsGrid;
