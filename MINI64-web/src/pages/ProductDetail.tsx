import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import {
  ChevronRight,
  Minus,
  PackageCheck,
  PackageX,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";
import { useCart } from "../context/CartContext";

type TabKey = "description" | "reviews" | "shipping";

type ProductReference = {
  _id?: string;
  name?: string;
};

type ProductItem = {
  _id: string;
  name: string;
  image: string;
  price: number;
  stock: number;
  rating: number;
  description: string;
  category?: ProductReference | null;
  brand?: ProductReference | null;
};

type RelatedProduct = {
  _id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  stock: number;
  rating: number;
};

const productTabs: { key: TabKey; label: string }[] = [
  { key: "description", label: "Mô tả chi tiết" },
  { key: "reviews", label: "Đánh giá" },
  { key: "shipping", label: "Chính sách vận chuyển" },
];

const apiUrl = import.meta.env.VITE_API_URL;

const formatBadgeClass = (inStock: boolean) =>
  inStock
    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30"
    : "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30";

function formatCurrency(price: number) {
  return `${price.toLocaleString("vi-VN")}đ`;
}

function buildProductImages(product?: ProductItem | null) {
  if (!product?.image) {
    return [];
  }

  return [product.image, product.image, product.image, product.image];
}

function detectScale(product?: ProductItem | null) {
  if (!product) {
    return "1:64";
  }

  const source = `${product.name} ${product.description}`.toLowerCase();

  if (source.includes("1:18")) return "1:18";
  if (source.includes("1:43")) return "1:43";
  return "1:64";
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-4 border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-white/10">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span className="col-span-2 text-sm font-semibold text-gray-800 dark:text-white/90">
        {value}
      </span>
    </div>
  );
}

function TabButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
        isActive
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 dark:bg-brand-500"
          : "bg-white text-gray-600 ring-1 ring-gray-200 hover:text-indigo-600 dark:bg-gray-900 dark:text-gray-300 dark:ring-white/10 dark:hover:text-brand-400"
      }`}
    >
      {label}
    </button>
  );
}

function RelatedProductCard({
  _id,
  name,
  category,
  price,
  image,
  stock,
  rating,
}: RelatedProduct) {
  const isInStock = stock > 0;

  return (
    <Link
      to={`/products/${_id}`}
      className="group overflow-hidden rounded-[28px] border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-white/10 dark:bg-gray-900"
    >
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-gray-100 via-white to-indigo-50 dark:from-gray-800 dark:via-gray-900 dark:to-brand-950">
        <img
          src={image}
          alt={name}
          className="h-56 w-full object-cover transition duration-500 group-hover:scale-110"
        />
      </div>
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">
            {category}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${formatBadgeClass(isInStock)}`}
          >
            {isInStock ? "Còn hàng" : "Hết hàng"}
          </span>
        </div>
        <h3 className="line-clamp-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-brand-400">
          {name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-indigo-700 dark:text-brand-400">
            {formatCurrency(price)}
          </span>
          <span className="flex items-center gap-1 text-sm text-amber-500">
            <Star className="h-4 w-4 fill-current" />
            {rating.toFixed(1)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<TabKey>("description");

  const productImages = useMemo(() => buildProductImages(product), [product]);
  const inStock = (product?.stock ?? 0) > 0;
  const categoryName = product?.category?.name ?? "Danh mục";
  const brandName = product?.brand?.name ?? "Đang cập nhật";
  const description = product?.description ?? "";
  const productName = product?.name ?? "Chi tiết sản phẩm";

  useEffect(() => {
    setQuantity(1);
    setActiveTab("description");
  }, [id]);

  useEffect(() => {
    const fetchProductDetail = async () => {
      if (!id) {
        setError("Không tìm thấy mã sản phẩm.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await axios.get(`${apiUrl}/api/product/get-details/${id}`);
        const fetchedProduct = response.data?.data as ProductItem | undefined;

        if (!fetchedProduct) {
          setError("Không tìm thấy thông tin sản phẩm.");
          setProduct(null);
          return;
        }

        setProduct(fetchedProduct);
        setSelectedImage(fetchedProduct.image);
      } catch (err) {
        console.error(err);
        setError("Không thể tải chi tiết sản phẩm từ backend.");
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [id]);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!product?._id) {
        setRelatedProducts([]);
        setRelatedLoading(false);
        return;
      }

      try {
        setRelatedLoading(true);
        const response = await axios.get(`${apiUrl}/api/product/get-all`, {
          params: {
            limit: 8,
            page: 0,
          },
        });

        const fetchedProducts = (response.data?.data ?? []) as ProductItem[];
        const sameCategoryProducts = fetchedProducts
          .filter(
            (item) =>
              item._id !== product._id &&
              item.category?._id &&
              item.category._id === product.category?._id,
          )
          .slice(0, 4)
          .map((item) => ({
            _id: item._id,
            name: item.name,
            category: item.category?.name ?? "Danh mục",
            price: item.price,
            image: item.image,
            stock: item.stock,
            rating: item.rating,
          }));

        const fallbackProducts = fetchedProducts
          .filter((item) => item._id !== product._id)
          .slice(0, 4)
          .map((item) => ({
            _id: item._id,
            name: item.name,
            category: item.category?.name ?? "Danh mục",
            price: item.price,
            image: item.image,
            stock: item.stock,
            rating: item.rating,
          }));

        setRelatedProducts(
          sameCategoryProducts.length > 0 ? sameCategoryProducts : fallbackProducts,
        );
      } catch (err) {
        console.error(err);
        setRelatedProducts([]);
      } finally {
        setRelatedLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [product]);

  const specifications = [
    { label: "Tỷ lệ", value: detectScale(product) },
    { label: "Hãng", value: brandName },
    { label: "Chất liệu", value: "Die-cast kim loại, chi tiết nhựa ABS" },
  ];

  const renderTabContent = () => {
    if (activeTab === "reviews") {
      return (
        <div className="space-y-5">
          <div className="rounded-[24px] bg-gray-50 p-5 dark:bg-white/5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-base font-bold text-gray-900 dark:text-white">
                  Nguyễn Minh Khang
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Hoàn thiện tốt, nước sơn đẹp và bánh xe lăn mượt.
                </p>
              </div>
              <span className="flex items-center gap-1 text-sm font-semibold text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                5.0
              </span>
            </div>
          </div>
          <div className="rounded-[24px] bg-gray-50 p-5 dark:bg-white/5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-base font-bold text-gray-900 dark:text-white">
                  Trần Gia Huy
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Đóng gói kỹ, giao đúng mẫu, rất hợp để trưng trong tủ kính.
                </p>
              </div>
              <span className="flex items-center gap-1 text-sm font-semibold text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                4.8
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "shipping") {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] bg-gray-50 p-5 dark:bg-white/5">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-brand-500/15 dark:text-brand-400">
              <Truck className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Giao hàng toàn quốc
            </h3>
            <p className="mt-2 text-sm leading-7 text-gray-600 dark:text-gray-300">
              Đơn hàng được xử lý trong 24 giờ, đóng gói chống sốc và hỗ trợ
              kiểm tra ngoại quan khi nhận.
            </p>
          </div>
          <div className="rounded-[24px] bg-gray-50 p-5 dark:bg-white/5">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Chính sách đổi trả
            </h3>
            <p className="mt-2 text-sm leading-7 text-gray-600 dark:text-gray-300">
              Hỗ trợ đổi mới nếu sản phẩm lỗi do vận chuyển hoặc sai mẫu trong
              3 ngày kể từ khi nhận hàng.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 text-sm leading-7 text-gray-600 dark:text-gray-300">
        {description.split("\n").filter(Boolean).length > 0 ? (
          description
            .split("\n")
            .filter(Boolean)
            .map((paragraph, index) => <p key={index}>{paragraph}</p>)
        ) : (
          <p>Mô tả sản phẩm đang được cập nhật.</p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-28 dark:bg-gray-950">
        <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
          <div className="rounded-[36px] border border-dashed border-gray-300 bg-white px-6 py-20 text-center text-sm text-gray-500 dark:border-white/10 dark:bg-gray-900 dark:text-gray-400">
            Đang tải thông tin sản phẩm...
          </div>
        </section>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 pt-28 dark:bg-gray-950">
        <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
          <div className="rounded-[36px] border border-red-200 bg-red-50 px-6 py-16 text-center dark:border-red-500/20 dark:bg-red-500/10">
            <p className="text-base font-semibold text-red-600 dark:text-red-300">
              {error || "Không tìm thấy sản phẩm."}
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex rounded-2xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-themeYellow hover:text-black"
            >
              Quay về trang chủ
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28 text-gray-900 dark:bg-gray-950 dark:text-white">
      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        <div className="rounded-[36px] border border-gray-100 bg-white/90 p-5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-gray-900/90 sm:p-6 lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
            <div className="space-y-4">
              <div className="group relative overflow-hidden rounded-[32px] bg-gradient-to-br from-gray-100 via-white to-indigo-50 p-4 dark:from-gray-800 dark:via-gray-900 dark:to-brand-950">
                <div className="absolute inset-x-8 top-6 h-24 rounded-full bg-indigo-200/40 blur-3xl dark:bg-brand-500/20" />
                <img
                  src={selectedImage}
                  alt={productName}
                  className="relative h-[320px] w-full rounded-[28px] object-cover transition duration-500 group-hover:scale-110 sm:h-[420px] lg:h-[540px]"
                />
              </div>

              <div className="grid grid-cols-4 gap-3">
                {productImages.map((image, index) => {
                  const isActive = image === selectedImage;

                  return (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      className={`overflow-hidden rounded-[22px] border bg-white p-2 transition-all ${
                        isActive
                          ? "border-indigo-500 shadow-lg shadow-indigo-500/15 dark:border-brand-400"
                          : "border-gray-100 hover:border-indigo-300 dark:border-white/10 dark:hover:border-brand-500/60"
                      }`}
                      >
                      <img
                        src={image}
                        alt={`${productName} ${index + 1}`}
                        className="h-20 w-full rounded-2xl object-cover sm:h-24"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Link
                  to="/"
                  className="transition-colors hover:text-indigo-600 dark:hover:text-brand-400"
                >
                  Trang chủ
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span>{categoryName}</span>
                <ChevronRight className="h-4 w-4" />
                <span className="font-semibold text-gray-800 dark:text-white/90">
                  {productName}
                </span>
              </nav>

              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${formatBadgeClass(inStock)}`}
                >
                  {inStock ? (
                    <PackageCheck className="h-4 w-4" />
                  ) : (
                    <PackageX className="h-4 w-4" />
                  )}
                  {inStock ? "Còn hàng" : "Hết hàng"}
                </span>
                <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 dark:bg-white/5 dark:text-gray-300">
                  Mã SP: {product._id.slice(-8).toUpperCase()}
                </span>
              </div>

              <h1 className="max-w-xl text-3xl font-bold leading-tight text-gray-900 dark:text-white sm:text-4xl">
                {productName}
              </h1>

              <div className="mt-4 flex items-center gap-3">
                <span className="text-3xl font-bold text-red-500 dark:text-red-400">
                  {formatCurrency(product.price)}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                  <Star className="h-4 w-4 fill-current" />
                  {product.rating.toFixed(1)}
                </span>
              </div>

              <p className="mt-5 max-w-2xl text-base leading-8 text-gray-600 dark:text-gray-300">
                {description || "Mô tả sản phẩm đang được cập nhật."}
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <div className="inline-flex h-14 items-center justify-between rounded-2xl border border-gray-200 bg-white px-3 shadow-sm dark:border-white/10 dark:bg-gray-950 sm:w-[180px]">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-brand-400"
                    aria-label="Giảm số lượng"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-brand-400"
                    aria-label="Tăng số lượng"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!product) return;

                    addToCart({
                      productId: product._id,
                      name: product.name,
                      image: product.image,
                      price: product.price,
                      amount: quantity,
                      scale: detectScale(product),
                      brand: brandName,
                      stock: product.stock,
                    });
                  }}
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-6 text-base font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-themeYellow hover:text-black dark:bg-brand-500 dark:hover:bg-themeYellow dark:hover:text-black"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Thêm vào giỏ hàng
                </button>
              </div>

              <div className="mt-8 overflow-hidden rounded-[28px] border border-gray-100 bg-gray-50/80 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="border-b border-gray-100 px-4 py-4 dark:border-white/10">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    Thông số kỹ thuật
                  </h2>
                </div>
                {specifications.map((spec) => (
                  <SpecRow key={spec.label} {...spec} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-[36px] border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900 lg:p-8">
          <div className="flex flex-wrap gap-3">
            {productTabs.map((tab) => (
              <TabButton
                key={tab.key}
                label={tab.label}
                isActive={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
              />
            ))}
          </div>

          <div className="mt-6 rounded-[28px] border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-gray-950/70 sm:p-6">
            {renderTabContent()}
          </div>
        </div>

        <div className="mt-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-indigo-600 dark:text-brand-400">
                Sản phẩm liên quan
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                Gợi ý thêm cho bộ sưu tập của bạn
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {relatedLoading ? (
              <div className="col-span-full rounded-[28px] border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500 dark:border-white/10 dark:bg-gray-900 dark:text-gray-400">
                Đang tải sản phẩm liên quan...
              </div>
            ) : relatedProducts.length > 0 ? (
              relatedProducts.map((item) => (
                <RelatedProductCard key={item._id} {...item} />
              ))
            ) : (
              <div className="col-span-full rounded-[28px] border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500 dark:border-white/10 dark:bg-gray-900 dark:text-gray-400">
                Chưa có sản phẩm liên quan phù hợp.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default ProductDetail;
