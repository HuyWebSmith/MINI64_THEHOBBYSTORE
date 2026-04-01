import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  Heart,
  Image as ImageIcon,
  PackageCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { FaRegHeart, FaStar } from "react-icons/fa";
import { MdAddShoppingCart, MdOutlineRemoveRedEye } from "react-icons/md";
import axios from "axios";
import AOS from "aos";
import "aos/dist/aos.css";
import Modal from "./Modal";
import type { ProductItem } from "../types/shop";
import {
  apiUrl,
  dispatchCartChanged,
  dispatchWishlistChanged,
  formatCurrency,
  getAuthHeaders,
} from "../utils/shop";

type ProductsGridProps = {
  selectedCategoryId?: string | null;
  selectedCategoryName?: string;
};

const ProductsGrid = ({
  selectedCategoryId = null,
  selectedCategoryName,
}: ProductsGridProps) => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [previewMode, setPreviewMode] = useState<"image" | "3d">("image");
  const navigate = useNavigate();

  const filteredProducts = selectedCategoryId
    ? products.filter((product) => product.category?._id === selectedCategoryId)
    : products;

  const showMessage = (message: string) => {
    setActionMessage(message);
    window.setTimeout(() => setActionMessage(""), 2500);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${apiUrl}/api/product/get-all`, {
        params: {
          limit: 100,
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

  const fetchWishlist = async () => {
    const headers = getAuthHeaders();

    if (!headers) {
      setWishlistIds([]);
      return;
    }

    try {
      const response = await axios.get(`${apiUrl}/api/user/wishlist`, {
        headers,
      });
      const items: ProductItem[] = response.data?.data ?? [];
      setWishlistIds(items.map((item) => item._id));
    } catch (err) {
      console.error(err);
      setWishlistIds([]);
    }
  };

  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: "ease-in-out",
      once: false,
    });

    fetchProducts();
    fetchWishlist();
  }, []);

  useEffect(() => {
    AOS.refresh();
  }, [products, loading]);

  useEffect(() => {
    const syncUserData = () => {
      fetchWishlist();
    };

    window.addEventListener("auth-changed", syncUserData);
    window.addEventListener("wishlist-changed", syncUserData);

    return () => {
      window.removeEventListener("auth-changed", syncUserData);
      window.removeEventListener("wishlist-changed", syncUserData);
    };
  }, []);

  useEffect(() => {
    if (!selectedProduct) {
      setPreviewMode("image");
      return;
    }

    setPreviewMode(selectedProduct.model3dUrl ? "3d" : "image");
  }, [selectedProduct]);

  const renderStars = (rating: number) => {
    const fullStars = Math.max(0, Math.min(5, Math.round(rating)));

    return Array.from({ length: 5 }, (_, index) => (
      <FaStar
        key={`${rating}-${index}`}
        className={index < fullStars ? "text-themepurple" : "text-gray-300"}
      />
    ));
  };

  const handleWishlistToggle = async (productId: string) => {
    const headers = getAuthHeaders();

    if (!headers) {
      showMessage("Hay dang nhap de luu san pham yeu thich.");
      return;
    }

    try {
      const response = await axios.post(
        `${apiUrl}/api/user/wishlist/toggle`,
        { productId },
        { headers },
      );

      if (response.data?.status !== "OK") {
        showMessage(response.data?.message ?? "Khong the cap nhat yeu thich luc nay.");
        return;
      }

      const updatedItems: ProductItem[] = response.data?.data ?? [];
      setWishlistIds(updatedItems.map((item) => item._id));
      showMessage(
        response.data?.liked
          ? "Da them vao danh sach yeu thich."
          : "Da xoa khoi danh sach yeu thich.",
      );
      dispatchWishlistChanged();
    } catch (err) {
      console.error(err);
      showMessage("Khong the cap nhat yeu thich luc nay.");
    }
  };

  const handleAddToCart = async (productId: string) => {
    const headers = getAuthHeaders();

    if (!headers) {
      showMessage("Hay dang nhap de them san pham vao gio hang.");
      return;
    }

    try {
      const response = await axios.post(
        `${apiUrl}/api/cart/add`,
        { productId, quantity: 1 },
        { headers },
      );

      if (response.data?.status !== "OK") {
        showMessage(response.data?.message ?? "Khong the them san pham vao gio hang.");
        return;
      }

      showMessage("Da them san pham vao gio hang.");
      dispatchCartChanged();
    } catch (err) {
      console.error(err);
      showMessage("Khong the them san pham vao gio hang.");
    }
  };

  return (
    <div
      id="products"
      className="flex w-full flex-col items-center justify-center gap-4 bg-gray-100 px-5 py-[80px] lg:px-20"
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
        {selectedCategoryName
          ? `Trending Products - ${selectedCategoryName}`
          : "Trending Products"}
      </h1>

      {actionMessage && (
        <div className="mt-4 rounded-full border border-purple-200 bg-white px-5 py-3 text-sm font-semibold text-themepurple shadow-sm">
          {actionMessage}
        </div>
      )}

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
            {filteredProducts.map((item) => (
              <div
                id="product-box"
                key={item._id}
                className="relative flex flex-col items-center justify-center gap-2 rounded-[28px] bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-[220px] w-full rounded-[22px] object-cover"
                />
                <div
                  id="icons"
                  className="absolute right-[20px] top-[20px] flex items-center justify-center gap-3"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(item)}
                    className="rounded-full bg-purple-500 p-3 text-white transition hover:bg-yellow-400 hover:text-black"
                  >
                    <MdOutlineRemoveRedEye />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWishlistToggle(item._id)}
                    className={`rounded-full p-3 text-white transition hover:text-black ${
                      wishlistIds.includes(item._id)
                        ? "bg-themeYellow text-black"
                        : "bg-purple-500 hover:bg-yellow-400"
                    }`}
                  >
                    {wishlistIds.includes(item._id) ? (
                      <Heart className="fill-current" size={16} />
                    ) : (
                      <FaRegHeart />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(item._id)}
                    className="rounded-full bg-purple-500 p-3 text-white transition hover:bg-yellow-400 hover:text-black"
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
                  {formatCurrency(item.price)}
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

          {filteredProducts.length === 0 && (
            <div className="mt-10 w-full rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center text-sm text-gray-500">
              Chua co san pham nao trong danh muc nay.
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              data-aos="zoom-in"
              data-aos-delay="400"
              to="/wishlist"
              className="inline-flex items-center gap-2 rounded-full border border-purple-500 px-6 py-3 font-semibold text-purple-600 transition hover:bg-purple-500 hover:text-white"
            >
              <Sparkles size={18} />
              Xem yeu thich
            </Link>
            <Link
              data-aos="zoom-in"
              data-aos-delay="450"
              to="/cart"
              className="inline-flex items-center gap-2 rounded-full bg-purple-500 px-8 py-3 font-semibold text-white transition hover:bg-yellow-500 hover:text-black"
            >
              <ShoppingBag size={18} />
              Xem gio hang
            </Link>
          </div>
        </>
      )}

      <Modal
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.name}
        className="max-w-4xl"
      >
        {selectedProduct && (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              {selectedProduct.model3dUrl && (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("3d")}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      previewMode === "3d"
                        ? "bg-purple-600 text-white"
                        : "border border-slate-200 text-slate-600"
                    }`}
                  >
                    <Box size={16} />
                    Xem 3D
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode("image")}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      previewMode === "image"
                        ? "bg-purple-600 text-white"
                        : "border border-slate-200 text-slate-600"
                    }`}
                  >
                    <ImageIcon size={16} />
                    Xem anh
                  </button>
                </div>
              )}

              {previewMode === "3d" && selectedProduct.model3dUrl ? (
                <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950">
                  <model-viewer
                    src={selectedProduct.model3dUrl}
                    camera-controls
                    auto-rotate
                    shadow-intensity="1"
                    exposure="1"
                    ar
                    style={{ width: "100%", height: "340px" }}
                  />
                </div>
              ) : (
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="h-[340px] w-full rounded-[26px] object-cover"
                />
              )}
            </div>
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-600">
                <PackageCheck size={16} />
                {selectedProduct.category?.name ?? "Danh muc"}
              </div>
              <h2 className="text-3xl font-black text-slate-900">
                {selectedProduct.name}
              </h2>
              <p className="text-lg font-semibold text-themepurple">
                {formatCurrency(selectedProduct.price)}
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  {renderStars(selectedProduct.rating)}
                </div>
                <span>|</span>
                <span>
                  Thuong hieu: {selectedProduct.brand?.name ?? "Dang cap nhat"}
                </span>
              </div>
              <p className="leading-7 text-slate-600">
                {selectedProduct.description ??
                  "San pham dang duoc cap nhat mo ta."}
              </p>
              <div className="rounded-[22px] bg-slate-50 p-5 text-sm text-slate-600">
                <p>Ton kho: {selectedProduct.stock}</p>
                <p className="mt-2">
                  Trang thai:{" "}
                  {selectedProduct.stock > 0
                    ? "San sang giao hang"
                    : "Tam het hang"}
                </p>
                {selectedProduct.model3dUrl && (
                  <p className="mt-2 text-purple-600">
                    San pham nay co mo hinh 3D de xoay xem truc tiep.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleAddToCart(selectedProduct._id)}
                  className="rounded-full bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700"
                >
                  Them vao gio
                </button>
                <button
                  type="button"
                  onClick={() => handleWishlistToggle(selectedProduct._id)}
                  className="rounded-full border border-purple-200 px-6 py-3 font-semibold text-purple-600 transition hover:border-purple-600"
                >
                  {wishlistIds.includes(selectedProduct._id)
                    ? "Bo yeu thich"
                    : "Them yeu thich"}
                </button>
                {!getAuthHeaders() && (
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="rounded-full border border-slate-200 px-6 py-3 font-semibold text-slate-600 transition hover:border-slate-400"
                  >
                    Dang nhap de mua
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductsGrid;
