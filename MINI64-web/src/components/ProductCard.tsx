import { Link } from "react-router-dom";
import { Crown, Flame, ShoppingBag, Sparkles } from "lucide-react";
import { FaRegHeart, FaStar } from "react-icons/fa";
import { MdAddShoppingCart, MdOutlineRemoveRedEye } from "react-icons/md";
import {
  getScarcityLevel,
  getStockProgress,
  type ProductSpecialState,
} from "../utils/productCardState";

type ProductCardProps = {
  id: string;
  name: string;
  image: string;
  price: number;
  rating: number;
  stock: number;
  categoryName?: string;
  brandName?: string;
  scale?: string;
  specialState?: ProductSpecialState;
  serialNumber?: string;
  estimatedReleaseDate?: string;
  onAddToCart: () => void;
};

const formatCurrency = (price: number) => `${price.toLocaleString("vi-VN")}đ`;

export default function ProductCard({
  id,
  name,
  image,
  price,
  rating,
  stock,
  categoryName,
  brandName,
  scale = "1:64",
  specialState = "default",
  serialNumber,
  estimatedReleaseDate,
  onAddToCart,
}: ProductCardProps) {
  const scarcityLevel = getScarcityLevel(stock);
  const isLimited = specialState === "limited";
  const isFeatured = specialState === "featured";
  const isPreorder = specialState === "preorder";
  const progress = getStockProgress(stock);

  const renderStars = () => {
    const fullStars = Math.max(0, Math.min(5, Math.round(rating)));

    return Array.from({ length: 5 }, (_, index) => (
      <FaStar
        key={`${id}-${index}`}
        className={index < fullStars ? "text-amber-400" : "text-gray-300"}
      />
    ));
  };

  return (
    <div
      className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-[28px] border bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl ${
        isFeatured
          ? "border-amber-300 shadow-[0_16px_60px_rgba(245,158,11,0.22)]"
          : "border-white/70"
      }`}
    >
      {isFeatured ? (
        <div className="pointer-events-none absolute inset-0 rounded-[28px] border border-amber-300/80 shadow-[0_0_0_1px_rgba(252,211,77,0.35),0_0_30px_rgba(251,191,36,0.25)]" />
      ) : null}

      <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-slate-100 via-white to-amber-50">
        <img
          src={image}
          alt={name}
          className="h-[240px] w-full object-cover transition duration-500 group-hover:scale-105"
        />

        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
          {isFeatured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white">
              <Flame className="h-3.5 w-3.5" />
              Hot
            </span>
          ) : null}

          {isLimited ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-950/90 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-amber-200">
              <Crown className="h-3.5 w-3.5" />
              {serialNumber ?? "#01/64"}
            </span>
          ) : null}

          {isPreorder ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
              <Sparkles className="h-3.5 w-3.5" />
              Pre-order
            </span>
          ) : null}
        </div>

        <div className="absolute right-3 top-3 flex flex-col items-center gap-2 opacity-0 transition group-hover:opacity-100">
          <Link
            to={`/products/${id}`}
            aria-label={`Xem chi tiết ${name}`}
            className="rounded-full bg-indigo-600 p-3 text-white transition hover:bg-amber-400 hover:text-black"
          >
            <MdOutlineRemoveRedEye />
          </Link>
          <button
            type="button"
            className="rounded-full bg-indigo-600 p-3 text-white transition hover:bg-amber-400 hover:text-black"
            aria-label={`Yêu thích ${name}`}
          >
            <FaRegHeart />
          </button>
        </div>
      </div>

      <div className="mt-5 flex-1">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">
          {categoryName ?? "Mini64 Selection"}
        </p>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">{name}</h3>
        <p className="mt-2 text-sm text-slate-500">
          {brandName ?? "Mini64"} • Scale {scale}
        </p>
        <p className="mt-3 text-2xl font-bold text-indigo-700">
          {formatCurrency(price)}
        </p>

        {scarcityLevel === "critical" ? (
          <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600">
            Last Few Pieces
          </div>
        ) : null}

        {isLimited ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span>Remaining stock</span>
              <span>{stock} left</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-amber-100">
              <div
                className={`h-full rounded-full ${
                  scarcityLevel === "critical" ? "bg-rose-500" : "bg-amber-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : null}

        {isPreorder ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-700">
            <p className="font-semibold uppercase tracking-[0.16em]">
              Estimated Release
            </p>
            <p className="mt-1 font-medium">
              {estimatedReleaseDate ?? "Q4 2026"}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1">{renderStars()}</div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              stock > 0
                ? "bg-indigo-50 text-indigo-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {stock > 0 ? `${stock} in stock` : "Sold out"}
          </span>
        </div>

        <button
          type="button"
          onClick={onAddToCart}
          className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold transition ${
            isPreorder
              ? "bg-emerald-600 text-white hover:bg-emerald-500"
              : "bg-indigo-600 text-white hover:bg-amber-400 hover:text-black"
          }`}
        >
          {isPreorder ? <ShoppingBag className="h-4 w-4" /> : <MdAddShoppingCart />}
          {isPreorder ? "Reserve Now" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
