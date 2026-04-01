export const apiUrl = import.meta.env.VITE_API_URL;

export const getAccessToken = () => localStorage.getItem("access_token");

export const getAuthHeaders = () => {
  const token = getAccessToken();

  if (!token) {
    return null;
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const dispatchCartChanged = () => {
  window.dispatchEvent(new Event("cart-changed"));
};

export const dispatchWishlistChanged = () => {
  window.dispatchEvent(new Event("wishlist-changed"));
};

export const formatCurrency = (value: number) =>
  value.toLocaleString("vi-VN") + "đ";
