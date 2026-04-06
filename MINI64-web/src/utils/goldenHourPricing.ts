type ProductLike = {
  id?: string;
  _id?: string;
  originalPrice?: number;
  price?: number;
};

type PinnedProductLike = {
  id: string;
  tempPrice: number;
};

export function getDisplayPrice(
  product: ProductLike | null | undefined,
  pinnedProduct?: PinnedProductLike | null,
) {
  if (!product) {
    return 0;
  }

  const productId = product.id || product._id;
  if (pinnedProduct?.id && productId === pinnedProduct.id) {
    return Number(pinnedProduct.tempPrice ?? 0);
  }

  return Number(product.originalPrice ?? product.price ?? 0);
}

export function formatGoldenHourCountdown(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
