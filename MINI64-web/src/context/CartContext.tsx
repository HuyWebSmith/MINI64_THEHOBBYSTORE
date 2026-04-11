import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import toast from "react-hot-toast";
import { UserContext } from "./UserContext";

export type CartItem = {
  productId: string;
  name: string;
  image: string;
  price: number;
  amount: number;
  scale: string;
  brand: string;
  stock: number;
};

type CartContextType = {
  cartItems: CartItem[];
  cartCount: number;
  subtotal: number;
  hasUnavailableItems: boolean;
  unavailableItems: CartItem[];
  addToCart: (item: CartItem) => void;
  updateQuantity: (productId: string, amount: number) => void;
  removeFromCart: (productId: string) => void;
  syncCartItemsStock: (
    updates: { productId: string; stock: number }[],
  ) => void;
  clearCart: () => void;
};

const CART_STORAGE_KEY_PREFIX = "mini64_cart";
const GUEST_CART_STORAGE_KEY = `${CART_STORAGE_KEY_PREFIX}_guest`;

const CartContext = createContext<CartContextType | undefined>(undefined);

function sanitizeCartItem(item: CartItem): CartItem {
  return {
    ...item,
    amount: Math.max(1, Math.floor(Number(item.amount) || 1)),
    stock: Math.max(0, Math.floor(Number(item.stock) || 0)),
  };
}

function getCartStorageKey(userId?: string | null) {
  return userId ? `${CART_STORAGE_KEY_PREFIX}_${userId}` : GUEST_CART_STORAGE_KEY;
}

function readCartFromStorage(storageKey: string) {
  if (typeof window === "undefined") {
    return [];
  }

  const storedCart = localStorage.getItem(storageKey);

  if (!storedCart) {
    return [];
  }

  try {
    return (JSON.parse(storedCart) as CartItem[]).map(sanitizeCartItem);
  } catch {
    return [];
  }
}

function writeCartToStorage(storageKey: string, items: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  if (items.length === 0) {
    localStorage.removeItem(storageKey);
    return;
  }

  localStorage.setItem(storageKey, JSON.stringify(items));
}

function mergeCartItems(currentItems: CartItem[], incomingItems: CartItem[]) {
  const mergedItems = [...currentItems];

  incomingItems.forEach((incomingItem) => {
    const normalizedItem = sanitizeCartItem(incomingItem);
    const existingIndex = mergedItems.findIndex(
      (item) => item.productId === normalizedItem.productId,
    );

    if (existingIndex === -1) {
      mergedItems.push({
        ...normalizedItem,
        amount: Math.min(normalizedItem.amount, normalizedItem.stock),
      });
      return;
    }

    const existingItem = mergedItems[existingIndex];
    const nextStock = Math.max(existingItem.stock, normalizedItem.stock);

    mergedItems[existingIndex] = {
      ...existingItem,
      ...normalizedItem,
      stock: nextStock,
      amount: Math.min(existingItem.amount + normalizedItem.amount, nextStock),
    };
  });

  return mergedItems;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useContext(UserContext);
  const activeCartKey = useMemo(() => getCartStorageKey(user?._id), [user?._id]);
  const previousCartKeyRef = useRef(activeCartKey);
  const [cartItems, setCartItems] = useState<CartItem[]>(() =>
    readCartFromStorage(activeCartKey),
  );

  useEffect(() => {
    const previousCartKey = previousCartKeyRef.current;

    if (previousCartKey === activeCartKey) {
      return;
    }

    let nextCartItems = readCartFromStorage(activeCartKey);

    if (
      previousCartKey === GUEST_CART_STORAGE_KEY &&
      activeCartKey !== GUEST_CART_STORAGE_KEY
    ) {
      const guestCartItems = readCartFromStorage(previousCartKey);

      if (guestCartItems.length > 0) {
        nextCartItems = mergeCartItems(nextCartItems, guestCartItems);
        writeCartToStorage(activeCartKey, nextCartItems);
        localStorage.removeItem(previousCartKey);
      }
    }

    setCartItems(nextCartItems);
    previousCartKeyRef.current = activeCartKey;
  }, [activeCartKey]);

  useEffect(() => {
    writeCartToStorage(activeCartKey, cartItems);
  }, [activeCartKey, cartItems]);

  const addToCart = (item: CartItem) => {
    setCartItems((current) => {
      const normalizedItem = sanitizeCartItem(item);

      if (normalizedItem.stock <= 0) {
        toast.error("Sản phẩm này hiện đã hết hàng.");
        return current;
      }

      const existingItem = current.find(
        (cartItem) => cartItem.productId === normalizedItem.productId,
      );

      if (!existingItem) {
        return [
          ...current,
          {
            ...normalizedItem,
            amount: Math.min(normalizedItem.amount, normalizedItem.stock),
          },
        ];
      }

      return current.map((cartItem) =>
        cartItem.productId === normalizedItem.productId
          ? {
              ...cartItem,
              ...normalizedItem,
              amount: Math.min(
                cartItem.amount + normalizedItem.amount,
                normalizedItem.stock,
              ),
            }
          : cartItem,
      );
    });
  };

  const updateQuantity = (productId: string, amount: number) => {
    setCartItems((current) =>
      current
        .map((item) =>
          item.productId === productId
            ? amount <= 0
              ? null
              : item.stock <= 0
                ? item
                : {
                    ...item,
                    amount: Math.max(1, Math.min(amount, item.stock)),
                  }
            : item,
        )
        .filter((item): item is CartItem => Boolean(item && item.amount > 0)),
    );
  };

  const removeFromCart = (productId: string) => {
    setCartItems((current) =>
      current.filter((item) => item.productId !== productId),
    );
  };

  const syncCartItemsStock = (updates: { productId: string; stock: number }[]) => {
    const stockMap = new Map(
      updates.map((update) => [
        update.productId,
        Math.max(0, Math.floor(Number(update.stock) || 0)),
      ]),
    );

    setCartItems((current) =>
      current.map((item) => {
        const nextStock = stockMap.get(item.productId);

        if (nextStock === undefined) {
          return item;
        }

        return {
          ...item,
          stock: nextStock,
          amount:
            nextStock > 0 ? Math.max(1, Math.min(item.amount, nextStock)) : item.amount,
        };
      }),
    );
  };

  const clearCart = () => {
    setCartItems([]);
    writeCartToStorage(activeCartKey, []);
  };

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.amount, 0),
    [cartItems],
  );

  const subtotal = useMemo(
    () => cartItems.reduce((total, item) => total + item.price * item.amount, 0),
    [cartItems],
  );

  const unavailableItems = useMemo(
    () =>
      cartItems.filter((item) => item.stock <= 0 || item.amount > item.stock),
    [cartItems],
  );

  const hasUnavailableItems = unavailableItems.length > 0;

  const value = useMemo(
    () => ({
      cartItems,
      cartCount,
      subtotal,
      hasUnavailableItems,
      unavailableItems,
      addToCart,
      updateQuantity,
      removeFromCart,
      syncCartItemsStock,
      clearCart,
    }),
    [cartCount, cartItems, hasUnavailableItems, subtotal, unavailableItems],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
