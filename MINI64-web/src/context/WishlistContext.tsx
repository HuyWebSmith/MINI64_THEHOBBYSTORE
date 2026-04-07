import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import axios from "axios";

type WishlistProduct = {
  _id: string;
  name: string;
  image: string;
  price: number;
  stock: number;
};

export type WishlistItem = {
  product: WishlistProduct;
  notifyOnSale: boolean;
  addedAt: string;
};

type WishlistContextType = {
  wishlistItems: WishlistItem[];
  wishlistIds: string[];
  toggleWishlist: (productId: string) => Promise<void>;
  setNotifyOnSale: (productId: string, notifyOnSale: boolean) => Promise<void>;
  refreshWishlist: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
const apiUrl = import.meta.env.VITE_API_URL;

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  const refreshWishlist = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setWishlistItems([]);
      return;
    }

    try {
      const response = await axios.get(`${apiUrl}/api/user/wishlist`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setWishlistItems(response.data?.data ?? []);
    } catch {
      setWishlistItems([]);
    }
  };

  useEffect(() => {
    void refreshWishlist();
  }, []);

  const toggleWishlist = async (productId: string) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      throw new Error("Please sign in to use wishlist.");
    }

    const response = await axios.post(
      `${apiUrl}/api/user/wishlist/${productId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    setWishlistItems(response.data?.data ?? []);
  };

  const setNotifyOnSale = async (productId: string, notifyOnSale: boolean) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      throw new Error("Please sign in to update wishlist alerts.");
    }

    const response = await axios.patch(
      `${apiUrl}/api/user/wishlist/${productId}/notify`,
      { notifyOnSale },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    setWishlistItems(response.data?.data ?? []);
  };

  const wishlistIds = useMemo(
    () =>
      wishlistItems
        .map((item) => item.product?._id)
        .filter((id): id is string => Boolean(id)),
    [wishlistItems],
  );

  const value = useMemo(
    () => ({
      wishlistItems,
      wishlistIds,
      toggleWishlist,
      setNotifyOnSale,
      refreshWishlist,
    }),
    [wishlistIds, wishlistItems],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }

  return context;
}
