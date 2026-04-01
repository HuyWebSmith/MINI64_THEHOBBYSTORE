export interface CatalogRef {
  _id: string;
  name: string;
}

export interface ProductItem {
  _id: string;
  name: string;
  image: string;
  model3dUrl?: string;
  model3dStatus?: "idle" | "processing" | "ready" | "failed";
  model3dProvider?: string;
  model3dJobId?: string;
  model3dError?: string;
  price: number;
  rating: number;
  stock: number;
  description?: string;
  category?: CatalogRef | null;
  brand?: CatalogRef | null;
}

export interface CartItem {
  _id: string;
  product: ProductItem | null;
  name: string;
  image: string;
  priceAtAdd: number;
  quantity: number;
}

export interface CartData {
  _id: string;
  user: string;
  items: CartItem[];
}

export interface OrderUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role?: string;
}

export interface OrderItem {
  product: ProductItem | null;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface OrderRecord {
  _id: string;
  user: OrderUser | null;
  items: OrderItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    note?: string;
  };
  paymentMethod: "COD";
  orderStatus: "pending" | "confirmed" | "shipping" | "completed" | "cancelled";
  subtotal: number;
  shippingFee: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}
