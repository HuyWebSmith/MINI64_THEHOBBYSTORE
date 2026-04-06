export const liveSession = {
  isActive: false,
  pinnedProduct: null,
  viewerCount: 0,
  orders: [],
  comments: [],
  remainingSeconds: 0,
};

export function getDisplayPrice(product) {
  if (!product) {
    return 0;
  }

  const productId = product.id?.toString?.() || product._id?.toString?.();
  if (liveSession.pinnedProduct?.id === productId) {
    return Number(liveSession.pinnedProduct.tempPrice ?? 0);
  }

  return Number(product.originalPrice ?? product.price ?? 0);
}

export function buildPinnedProduct(product, goldenHourPrice, durationSeconds = 300) {
  const safeDuration = Math.max(1, Number(durationSeconds) || 300);

  return {
    id: product._id.toString(),
    name: product.name,
    originalPrice: Number(product.price ?? 0),
    tempPrice: Number(goldenHourPrice),
    stock: Number(product.stock ?? 0),
    options: Array.isArray(product.options) ? product.options : [],
    goldenHourDuration: safeDuration,
    goldenHourEndsAt: Date.now() + safeDuration * 1000,
  };
}

export function getRemainingGoldenHourSeconds() {
  if (!liveSession.pinnedProduct?.goldenHourEndsAt) {
    return 0;
  }

  return Math.max(
    0,
    Math.ceil((liveSession.pinnedProduct.goldenHourEndsAt - Date.now()) / 1000),
  );
}

export function clearPinnedProduct() {
  liveSession.pinnedProduct = null;
  liveSession.remainingSeconds = 0;
}

export function updatePinnedGoldenHour(durationSeconds, tempPrice) {
  if (!liveSession.pinnedProduct) {
    return null;
  }

  const safeDuration = Math.max(1, Number(durationSeconds) || 300);
  liveSession.pinnedProduct = {
    ...liveSession.pinnedProduct,
    tempPrice:
      typeof tempPrice === "number" && !Number.isNaN(tempPrice)
        ? tempPrice
        : liveSession.pinnedProduct.tempPrice,
    goldenHourDuration: safeDuration,
    goldenHourEndsAt: Date.now() + safeDuration * 1000,
  };

  liveSession.remainingSeconds = safeDuration;
  return liveSession.pinnedProduct;
}
