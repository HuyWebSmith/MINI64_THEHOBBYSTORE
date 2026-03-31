import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Radio, ShoppingCart, History } from "lucide-react";
import LiveStreamEmbed from "../components/live/LiveStreamEmbed";
import {
  build100msRoomLink,
  getDefault100msLinks,
  getStoredUserInfo,
} from "../utils/liveStream";

const apiUrl = import.meta.env.VITE_API_URL;

interface ProductRecord {
  _id: string;
  name: string;
  image: string;
  price: number;
  stock: number;
  rating: number;
}

interface HostUserRecord {
  _id?: string;
  email?: string;
  name?: string;
}

interface LiveSessionRecord {
  _id: string;
  title: string;
  description: string;
  status: "draft" | "live" | "ended";
  streamProvider?: "100ms";
  hostRoomLink?: string;
  viewerRoomLink?: string;
  startedAt?: string | null;
  endedAt?: string | null;
  products: ProductRecord[];
  hostUser?: HostUserRecord | null;
  featuredProduct?: ProductRecord | null;
}

interface CartItem {
  _id: string;
  name: string;
  image: string;
  priceAtAdd: number;
  quantity: number;
}

interface CartRecord {
  _id: string;
  items: CartItem[];
}

const formatEventTime = (value?: string | null) => {
  if (!value) {
    return "Chua cap nhat";
  }

  try {
    return new Date(value).toLocaleString("vi-VN");
  } catch (error) {
    console.error(error);
    return "Chua cap nhat";
  }
};

const getEventCoverImage = (event: LiveSessionRecord) =>
  event.featuredProduct?.image || event.products[0]?.image || "";

const LivePage = () => {
  const [liveSession, setLiveSession] = useState<LiveSessionRecord | null>(null);
  const [recentEvents, setRecentEvents] = useState<LiveSessionRecord[]>([]);
  const [cart, setCart] = useState<CartRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [activeCartAction, setActiveCartAction] = useState<string | null>(null);

  const currentUser = getStoredUserInfo();
  const accessToken = localStorage.getItem("access_token");
  const default100msLinks = getDefault100msLinks(currentUser);
  const liveViewerRoomLink = build100msRoomLink({
    roomLink: liveSession?.viewerRoomLink || default100msLinks.viewerRoomLink,
    name: currentUser?.name || "Khach MINI64",
    userId: currentUser?._id || currentUser?.id || currentUser?.email,
  });

  const fetchLiveFeed = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/live-session/public-feed`);
      setLiveSession(response.data?.data?.currentLive ?? null);
      setRecentEvents(response.data?.data?.recentEvents ?? []);
    } catch (err) {
      console.error(err);
      setLiveSession(null);
      setRecentEvents([]);
      setInfoMessage(
        "Chua lay duoc du lieu livestream. Neu ban vua them API moi, hay restart MINI64-api.",
      );
    }
  };

  const fetchCart = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setCart(null);
      return;
    }

    try {
      const response = await axios.get(`${apiUrl}/api/cart/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCart(response.data?.data ?? null);
    } catch (err) {
      console.error(err);
      setCart(null);
    }
  };

  const fetchPageData = async () => {
    try {
      setLoading(true);
      setError("");
      setInfoMessage("");
      await Promise.all([fetchLiveFeed(), fetchCart()]);
    } catch (err) {
      setError("Khong the tai trang livestream.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, []);

  const addToCart = async (productId: string) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setCartMessage("Dang nhap de them san pham vao gio hang trong luc xem live.");
      return;
    }

    if (!liveSession) {
      return;
    }

    try {
      setActiveCartAction(productId);
      setCartMessage("");

      const response = await axios.post(
        `${apiUrl}/api/cart/add`,
        {
          productId,
          quantity: 1,
          liveSessionId: liveSession._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setCart(response.data?.data ?? null);
      setCartMessage("Da them san pham vao gio hang.");
      window.dispatchEvent(new Event("cart-changed"));
    } catch (err) {
      setCartMessage("Khong the them san pham vao gio hang.");
      console.error(err);
    } finally {
      setActiveCartAction(null);
    }
  };

  const updateCartItem = async (itemId: string, quantity: number) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      return;
    }

    try {
      const response = await axios.put(
        `${apiUrl}/api/cart/item/${itemId}`,
        {
          quantity,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setCart(response.data?.data ?? null);
      window.dispatchEvent(new Event("cart-changed"));
    } catch (err) {
      console.error(err);
    }
  };

  const removeCartItem = async (itemId: string) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      return;
    }

    try {
      const response = await axios.delete(`${apiUrl}/api/cart/item/${itemId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCart(response.data?.data ?? null);
      window.dispatchEvent(new Event("cart-changed"));
    } catch (err) {
      console.error(err);
    }
  };

  const totalItems = cart?.items.reduce(
    (total, item) => total + item.quantity,
    0,
  ) || 0;
  const totalPrice = cart?.items.reduce(
    (total, item) => total + item.quantity * item.priceAtAdd,
    0,
  ) || 0;

  const renderRecentEvents = () => {
    if (!recentEvents.length) {
      return null;
    }

    return (
      <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-themeYellow">
            <History size={22} />
          </span>
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-themeYellow">
              Lich su livestream
            </p>
            <h2 className="mt-1 text-2xl font-bold text-white">
              Cac su kien da live van duoc luu lai
            </h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recentEvents.map((event) => {
            const coverImage = getEventCoverImage(event);

            return (
              <div
                key={event._id}
                className="overflow-hidden rounded-[28px] border border-white/10 bg-black/20"
              >
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt={event.title}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-white/5 text-sm text-white/45">
                    Khong co anh cho su kien nay
                  </div>
                )}

                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
                      {event.status === "ended" ? "Da ket thuc" : "Dang live"}
                    </span>
                    <span className="text-xs text-white/45">
                      {event.products.length} san pham
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">{event.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm text-white/65">
                      {event.description || "Buoi livestream nay khong co mo ta chi tiet."}
                    </p>
                  </div>

                  <div className="space-y-1 text-sm text-white/60">
                    <p>Host: {event.hostUser?.name || "Admin MINI64"}</p>
                    <p>Bat dau: {formatEventTime(event.startedAt)}</p>
                    <p>Ket thuc: {formatEventTime(event.endedAt)}</p>
                    <p>
                      San pham ghim:{" "}
                      {event.featuredProduct?.name || "Chua ghim san pham"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 px-5 py-28 text-white lg:px-10">
      {loading ? (
        <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center text-sm text-white/70">
          Dang tai du lieu livestream...
        </div>
      ) : error ? (
        <div className="mx-auto max-w-6xl rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-10 text-center text-sm text-red-200">
          {error}
        </div>
      ) : !liveSession ? (
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900 to-black px-8 py-16 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-red-300">
              Livestream
            </p>
            <h1 className="mt-4 text-4xl font-bold text-white">
              Hien chua co buoi live nao dang dien ra
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-white/70">
              Khi admin bat dau livestream, trang nay se hien player 100ms, san
              pham dang ghim va gio hang de nguoi xem mua ngay trong luc live.
              Neu buoi live da ket thuc, ban van co the xem lich su su kien ngay
              ben duoi.
            </p>
            {infoMessage && (
              <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/75">
                {infoMessage}
              </div>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                onClick={fetchPageData}
                className="rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Thu tai lai
              </button>
              <Link
                to="/"
                className="rounded-full bg-themeYellow px-5 py-3 font-semibold text-black transition hover:opacity-90"
              >
                Ve trang chu
              </Link>
            </div>
          </div>

          {renderRecentEvents()}
        </div>
      ) : (
        <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#1f113c] via-[#0a0f2d] to-black shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200">
                    <Radio size={16} />
                    Dang live
                  </span>
                  <span className="text-sm text-white/60">
                    Xem 100ms tren web va mua ngay khi streamer dang gioi thieu san pham
                  </span>
                </div>
                <Link
                  to="/"
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10"
                >
                  Ve trang chu
                </Link>
              </div>

              <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_1fr]">
                <div className="space-y-6 rounded-[28px] bg-black/40 p-8">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-red-300">
                      LIVE SHOPPING
                    </p>
                    <h1 className="mt-4 text-4xl font-black leading-tight text-white">
                      {liveSession.title}
                    </h1>
                    <p className="mt-4 max-w-xl text-base text-white/70">
                      {liveSession.description || "Buoi livestream dang trung bay cac san pham noi bat trong cua hang."}
                    </p>
                    <p className="mt-3 text-sm text-white/55">
                      Host: {liveSession.hostUser?.name || "Admin MINI64"} • Provider:{" "}
                      {liveSession.streamProvider || "100ms"}
                    </p>
                  </div>

                  <LiveStreamEmbed
                    roomLink={liveViewerRoomLink}
                    title="Xem livestream tren website"
                    description="Viewer vao truc tiep phong 100ms ngay trong web. Neu ban muon trai nghiem day du hon, ban van co the mo phong o tab rieng."
                    emptyMessage="Buoi live nay chua co viewer room link 100ms. Vao admin/live de gan host room link va viewer room link."
                    overlayHint="San pham dang ghim tren livestream"
                    overlayProduct={liveSession.featuredProduct || null}
                    overlayBusy={
                      activeCartAction === liveSession.featuredProduct?._id
                    }
                    overlayActionLabel="Mua ngay tren live"
                    onOverlayAction={
                      liveSession.featuredProduct
                        ? () => addToCart(liveSession.featuredProduct!._id)
                        : undefined
                    }
                  />
                </div>

                <div className="rounded-[28px] border border-themeYellow/20 bg-themeYellow/10 p-6">
                  <p className="text-sm uppercase tracking-[0.25em] text-themeYellow">
                    San pham dang ghim
                  </p>
                  {liveSession.featuredProduct ? (
                    <div className="mt-5 space-y-4">
                      <img
                        src={liveSession.featuredProduct.image}
                        alt={liveSession.featuredProduct.name}
                        className="h-56 w-full rounded-[24px] object-cover"
                      />
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          {liveSession.featuredProduct.name}
                        </h2>
                        <p className="mt-2 text-lg font-semibold text-themeYellow">
                          {liveSession.featuredProduct.price.toLocaleString("vi-VN")}đ
                        </p>
                        <p className="mt-2 text-sm text-white/70">
                          Ton kho: {liveSession.featuredProduct.stock}
                        </p>
                      </div>
                      <button
                        onClick={() => addToCart(liveSession.featuredProduct!._id)}
                        disabled={activeCartAction === liveSession.featuredProduct._id}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-themeYellow px-5 py-3 font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <ShoppingCart size={18} />
                        {activeCartAction === liveSession.featuredProduct._id
                          ? "Dang them..."
                          : "Them vao gio"}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-dashed border-white/20 px-4 py-6 text-sm text-white/60">
                      Admin chua ghim san pham cho buoi live nay.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-themeYellow">
                    San pham trong buoi live
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    Chon san pham va them vao gio ngay tren livestream
                  </h2>
                </div>
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/70">
                  {liveSession.products.length} san pham
                </span>
              </div>

              {cartMessage && (
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                  {cartMessage}
                </div>
              )}

              {!liveViewerRoomLink && (
                <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  Chua co room link 100ms cho viewer. Admin can cap nhat link truoc
                  khi user co the xem live truc tiep tren website.
                </div>
              )}

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {liveSession.products.map((product) => (
                  <div
                    key={product._id}
                    className="rounded-[28px] border border-white/10 bg-black/20 p-4"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-52 w-full rounded-[22px] object-cover"
                    />
                    <h3 className="mt-4 text-lg font-semibold text-white">
                      {product.name}
                    </h3>
                    <p className="mt-2 text-sm text-white/60">
                      Ton kho: {product.stock}
                    </p>
                    <p className="mt-1 text-lg font-bold text-themeYellow">
                      {product.price.toLocaleString("vi-VN")}đ
                    </p>
                    <button
                      onClick={() => addToCart(product._id)}
                      disabled={activeCartAction === product._id}
                      className="mt-4 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {activeCartAction === product._id
                        ? "Dang them..."
                        : "Them vao gio"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {renderRecentEvents()}
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-themeYellow">
              Gio hang live
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              {accessToken ? "San pham vua them trong khi xem live" : "Dang nhap de mua ngay"}
            </h2>

            {!accessToken ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-white/15 px-5 py-6 text-sm text-white/70">
                <p>Ban can dang nhap de them san pham vao gio hang live.</p>
                <Link
                  to="/login"
                  className="mt-4 inline-flex rounded-full bg-themeYellow px-4 py-2 font-semibold text-black"
                >
                  Di den dang nhap
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="rounded-[24px] bg-black/30 p-5">
                  <div className="flex items-center justify-between text-sm text-white/60">
                    <span>Tong so san pham</span>
                    <span>{totalItems}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-lg font-bold text-white">
                    <span>Tam tinh</span>
                    <span>{totalPrice.toLocaleString("vi-VN")}đ</span>
                  </div>
                </div>

                {cart?.items?.length ? (
                  cart.items.map((item) => (
                    <div
                      key={item._id}
                      className="rounded-[24px] border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-16 w-16 rounded-2xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-white">
                            {item.name}
                          </p>
                          <p className="mt-1 text-sm text-white/60">
                            {item.priceAtAdd.toLocaleString("vi-VN")}đ
                          </p>
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateCartItem(item._id, item.quantity - 1)
                              }
                              className="h-8 w-8 rounded-full border border-white/10 text-white"
                            >
                              -
                            </button>
                            <span className="min-w-8 text-center text-sm font-semibold text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateCartItem(item._id, item.quantity + 1)
                              }
                              className="h-8 w-8 rounded-full border border-white/10 text-white"
                            >
                              +
                            </button>
                            <button
                              onClick={() => removeCartItem(item._id)}
                              className="ml-auto rounded-full border border-red-400/30 px-3 py-1 text-xs font-semibold text-red-200"
                            >
                              Xoa
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-white/15 px-5 py-6 text-sm text-white/60">
                    Gio hang cua ban dang trong. Thu bam "Them vao gio" o san
                    pham trong buoi live.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LivePage;
