export type ProductSpecialState = "featured" | "limited" | "preorder" | "default";

export function getScarcityLevel(stock: number) {
  if (stock <= 0) {
    return "sold-out";
  }

  if (stock < 5) {
    return "critical";
  }

  if (stock < 12) {
    return "low";
  }

  return "healthy";
}

export function getStockProgress(stock: number, maxStock = 64) {
  const safeMax = Math.max(1, maxStock);
  const clampedStock = Math.max(0, Math.min(stock, safeMax));

  return Math.round((clampedStock / safeMax) * 100);
}
