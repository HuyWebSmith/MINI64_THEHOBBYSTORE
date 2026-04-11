import { useContext, useEffect, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ChevronDown,
  Filter,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "../context/CartContext";
import { UserContext } from "../context/UserContext";

type BrandItem = {
  _id: string;
  name: string;
};

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
  createdAt?: string;
  category?: ProductReference | null;
  brand?: ProductReference | null;
};

type SortOption = "popular" | "price-asc" | "newest";

const apiUrl = import.meta.env.VITE_API_URL;
const scaleOptions = ["1:64", "1:43", "1:18"];
const visibleStep = 8;

function formatCurrency(price: number) {
  return `${price.toLocaleString("vi-VN")}đ`;
}

function detectScale(product: ProductItem) {
  const source = `${product.name} ${product.description}`.toLowerCase();
  const matchedScale = scaleOptions.find((scale) =>
    source.includes(scale.toLowerCase()),
  );

  return matchedScale ?? "1:64";
}

function ProductCard({ product }: { product: ProductItem }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const isOutOfStock = product.stock <= 0;
  const requireLogin = () => {
    toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng.");
    navigate("/login");
  };

  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-white/10 dark:bg-gray-900">
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-gray-100 via-white to-indigo-50 dark:from-gray-800 dark:via-gray-900 dark:to-brand-950">
        <img
          src={product.image}
          alt={product.name}
          className="h-64 w-full object-cover transition duration-500 group-hover:scale-110"
        />
        <Link
          to={`/products/${product._id}`}
          className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/95 px-4 py-3 text-center text-sm font-bold text-gray-900 opacity-0 shadow-lg transition duration-300 group-hover:opacity-100 dark:bg-gray-950/95 dark:text-white"
        >
          Xem nhanh
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">
            {product.brand?.name ?? "Mini64"}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              product.stock > 0
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30"
                : "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30"
            }`}
          >
            {product.stock > 0 ? `Còn ${product.stock}` : "Hết hàng"}
          </span>
        </div>

        <Link
          to={`/products/${product._id}`}
          className="block text-xl font-bold text-gray-900 transition-colors hover:text-indigo-600 dark:text-white dark:hover:text-brand-400"
        >
          {product.name}
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tỷ lệ {detectScale(product)}
            </p>
            <p className="text-2xl font-bold text-indigo-700 dark:text-brand-400">
              {formatCurrency(product.price)}
            </p>
          </div>
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => {
              if (!user) {
                requireLogin();
                return;
              }

              addToCart({
                productId: product._id,
                name: product.name,
                image: product.image,
                price: product.price,
                amount: 1,
                scale: detectScale(product),
                brand: product.brand?.name ?? "Mini64",
                stock: product.stock,
              });
            }}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 transition hover:bg-themeYellow hover:text-black disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none dark:bg-brand-500 dark:hover:bg-themeYellow dark:hover:text-black dark:disabled:bg-white/10 dark:disabled:text-white/40"
            aria-label={`Thêm nhanh ${product.name} vào giỏ`}
          >
            <ShoppingCart className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
      <h3 className="text-base font-bold text-gray-900 dark:text-white">
        {title}
      </h3>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
  count,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  count?: number;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl px-3 py-2 transition hover:bg-gray-50 dark:hover:bg-white/5">
      <span className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      </span>
      {typeof count === "number" ? (
        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
          {count}
        </span>
      ) : null}
    </label>
  );
}

function FiltersPanel({
  brands,
  selectedBrands,
  selectedScales,
  priceLimit,
  maxPrice,
  onToggleBrand,
  onToggleScale,
  onPriceChange,
  onReset,
}: {
  brands: BrandItem[];
  selectedBrands: string[];
  selectedScales: string[];
  priceLimit: number;
  maxPrice: number;
  onToggleBrand: (brandName: string) => void;
  onToggleScale: (scale: string) => void;
  onPriceChange: (value: number) => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-indigo-600 dark:text-brand-400">
            Bộ lọc
          </p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            Chọn mẫu bạn muốn
          </h2>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-semibold text-gray-500 transition hover:text-indigo-600 dark:text-gray-400 dark:hover:text-brand-400"
        >
          Xóa lọc
        </button>
      </div>

      <FilterSection title="Hãng xe">
        {brands.map((brand) => (
          <CheckboxRow
            key={brand._id}
            label={brand.name}
            checked={selectedBrands.includes(brand.name)}
            onChange={() => onToggleBrand(brand.name)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Tỷ lệ">
        {scaleOptions.map((scale) => (
          <CheckboxRow
            key={scale}
            label={scale}
            checked={selectedScales.includes(scale)}
            onChange={() => onToggleScale(scale)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Mức giá">
        <div className="space-y-4">
          <input
            type="range"
            min={0}
            max={Math.max(maxPrice, 100000)}
            step={10000}
            value={priceLimit}
            onChange={(event) => onPriceChange(Number(event.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 dark:bg-white/5 dark:text-gray-200">
            Tối đa: {formatCurrency(priceLimit)}
          </div>
        </div>
      </FilterSection>
    </div>
  );
}

function ProductListingPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedScales, setSelectedScales] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [visibleCount, setVisibleCount] = useState(visibleStep);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const fetchListingData = async () => {
      try {
        setLoading(true);
        setError("");

        const [productsResponse, brandsResponse] = await Promise.all([
          axios.get(`${apiUrl}/api/product/get-all`, {
            params: {
              limit: 100,
              page: 0,
            },
          }),
          axios.get(`${apiUrl}/api/brand/get-all`, {
            params: {
              limit: 100,
              page: 0,
            },
          }),
        ]);

        setProducts(productsResponse.data?.data ?? []);
        setBrands(brandsResponse.data?.data ?? []);
      } catch (err) {
        console.error(err);
        setError("Không thể tải danh sách sản phẩm từ backend.");
      } finally {
        setLoading(false);
      }
    };

    fetchListingData();
  }, []);

  const maxPrice = useMemo(() => {
    if (products.length === 0) {
      return 1000000;
    }

    return Math.max(...products.map((product) => product.price));
  }, [products]);

  const [priceLimit, setPriceLimit] = useState(1000000);

  useEffect(() => {
    setPriceLimit(maxPrice);
  }, [maxPrice]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.description.toLowerCase().includes(normalizedSearch) ||
        (product.brand?.name ?? "").toLowerCase().includes(normalizedSearch);

      const matchesBrand =
        selectedBrands.length === 0 ||
        selectedBrands.includes(product.brand?.name ?? "");

      const productScale = detectScale(product);
      const matchesScale =
        selectedScales.length === 0 || selectedScales.includes(productScale);

      const matchesPrice = product.price <= priceLimit;

      return matchesSearch && matchesBrand && matchesScale && matchesPrice;
    });

    const sorted = [...filtered];

    if (sortBy === "price-asc") {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === "newest") {
      sorted.sort((a, b) => {
        const left = new Date(a.createdAt ?? 0).getTime();
        const right = new Date(b.createdAt ?? 0).getTime();
        return right - left;
      });
    } else {
      sorted.sort((a, b) => b.rating - a.rating);
    }

    return sorted;
  }, [priceLimit, products, searchTerm, selectedBrands, selectedScales, sortBy]);

  useEffect(() => {
    setVisibleCount(visibleStep);
  }, [filteredProducts.length, priceLimit, searchTerm, selectedBrands, selectedScales, sortBy]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  const toggleSelection = (
    value: string,
    setter: Dispatch<SetStateAction<string[]>>,
  ) => {
    setter((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedBrands([]);
    setSelectedScales([]);
    setSortBy("popular");
    setPriceLimit(maxPrice);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-28 text-gray-900 dark:bg-gray-950 dark:text-white">
      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        <div className="mb-8 rounded-[36px] border border-gray-100 bg-gradient-to-br from-white via-white to-indigo-50 p-6 shadow-sm dark:border-white/10 dark:from-gray-900 dark:via-gray-900 dark:to-brand-950 lg:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-indigo-600 dark:text-brand-400">
            Shop Collection
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                Bộ sưu tập xe mô hình nổi bật
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600 dark:text-gray-300">
                Tìm nhanh mẫu xe theo hãng, tỷ lệ và mức giá, đồng bộ cùng phong
                cách giao diện trang chủ hiện tại.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-brand-500 dark:hover:text-brand-400 lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Mở bộ lọc
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <FiltersPanel
              brands={brands}
              selectedBrands={selectedBrands}
              selectedScales={selectedScales}
              priceLimit={priceLimit}
              maxPrice={maxPrice}
              onToggleBrand={(brandName) =>
                toggleSelection(brandName, setSelectedBrands)
              }
              onToggleScale={(scale) =>
                toggleSelection(scale, setSelectedScales)
              }
              onPriceChange={setPriceLimit}
              onReset={resetFilters}
            />
          </aside>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Tìm theo tên xe, hãng hoặc mô tả..."
                    className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-12 pr-4 text-sm text-gray-800 outline-none transition focus:border-indigo-400 focus:bg-white dark:border-white/10 dark:bg-gray-950 dark:text-white dark:focus:border-brand-500"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600 dark:bg-white/5 dark:text-gray-300">
                    Đang hiển thị {filteredProducts.length} mẫu xe
                  </div>

                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(event) =>
                        setSortBy(event.target.value as SortOption)
                      }
                      className="h-14 appearance-none rounded-2xl border border-gray-200 bg-white pl-4 pr-11 text-sm font-semibold text-gray-700 outline-none transition focus:border-indigo-400 dark:border-white/10 dark:bg-gray-950 dark:text-gray-200 dark:focus:border-brand-500"
                    >
                      <option value="popular">Phổ biến nhất</option>
                      <option value="price-asc">Giá thấp đến cao</option>
                      <option value="newest">Mới nhất</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="rounded-[32px] border border-dashed border-gray-300 bg-white px-6 py-16 text-center text-sm text-gray-500 dark:border-white/10 dark:bg-gray-900 dark:text-gray-400">
                Đang tải danh sách sản phẩm...
              </div>
            ) : error ? (
              <div className="rounded-[32px] border border-red-200 bg-red-50 px-6 py-16 text-center text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
                  {visibleProducts.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="rounded-[32px] border border-dashed border-gray-300 bg-white px-6 py-16 text-center text-sm text-gray-500 dark:border-white/10 dark:bg-gray-900 dark:text-gray-400">
                    Không có sản phẩm phù hợp với bộ lọc hiện tại.
                  </div>
                ) : null}

                {visibleCount < filteredProducts.length ? (
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleCount((current) => current + visibleStep)
                      }
                      className="rounded-2xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-themeYellow hover:text-black dark:bg-brand-500 dark:hover:bg-themeYellow dark:hover:text-black"
                    >
                      Xem thêm
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </section>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-full max-w-sm overflow-y-auto bg-white p-5 shadow-2xl dark:bg-gray-950">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-indigo-600 dark:text-brand-400" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Bộ lọc sản phẩm
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <FiltersPanel
              brands={brands}
              selectedBrands={selectedBrands}
              selectedScales={selectedScales}
              priceLimit={priceLimit}
              maxPrice={maxPrice}
              onToggleBrand={(brandName) =>
                toggleSelection(brandName, setSelectedBrands)
              }
              onToggleScale={(scale) =>
                toggleSelection(scale, setSelectedScales)
              }
              onPriceChange={setPriceLimit}
              onReset={resetFilters}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ProductListingPage;
