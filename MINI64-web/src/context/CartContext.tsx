import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

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
  addToCart: (item: CartItem) => void;
  updateQuantity: (productId: string, amount: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
};

const CART_STORAGE_KEY = "mini64_cart";

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const storedCart =
      typeof window !== "undefined"
        ? localStorage.getItem(CART_STORAGE_KEY)
        : null;

    if (!storedCart) {
      return [];
    }

    try {
      return JSON.parse(storedCart) as CartItem[];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: CartItem) => {
    setCartItems((current) => {
      const existingItem = current.find(
        (cartItem) => cartItem.productId === item.productId,
      );

      if (!existingItem) {
        return [...current, item];
      }

      return current.map((cartItem) =>
        cartItem.productId === item.productId
          ? {
              ...cartItem,
              amount: Math.min(cartItem.amount + item.amount, cartItem.stock),
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
            ? {
                ...item,
                amount: Math.max(1, Math.min(amount, item.stock)),
              }
            : item,
        )
        .filter((item) => item.amount > 0),
    );
  };

  const removeFromCart = (productId: string) => {
    setCartItems((current) =>
      current.filter((item) => item.productId !== productId),
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.amount, 0),
    [cartItems],
  );

  const subtotal = useMemo(
    () => cartItems.reduce((total, item) => total + item.price * item.amount, 0),
    [cartItems],
  );

  const value = useMemo(
    () => ({
      cartItems,
      cartCount,
      subtotal,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    }),
    [cartCount, cartItems, subtotal],
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
