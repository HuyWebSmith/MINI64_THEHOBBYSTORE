import { useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Peer from "simple-peer/simplepeer.min.js";
import { io } from "socket.io-client";
import { AnimatePresence, motion } from "framer-motion";
import {
  Clock3,
  MessageCircle,
  Minus,
  Plus,
  Send,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  formatGoldenHourCountdown,
  getDisplayPrice,
} from "../utils/goldenHourPricing";
import { useCart } from "../context/CartContext";
import { UserContext } from "../context/UserContext";

type ChatComment = {
  id: string;
  author: string;
  message: string;
  createdAt: string;
};

type SessionOrder = {
  id: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
};

type PinnedProduct = {
  id: string;
  name: string;
  originalPrice: number;
  tempPrice: number;
  stock: number;
  options?: string[];
};

type ProductReference = {
  _id?: string;
  name?: string;
};

type ProductItem = {
  _id: string;
  name: string;
  image: string;
  price: number;
  stock: number;
  description?: string;
  brand?: ProductReference | null;
};

type LiveStatePayload = {
  isActive: boolean;
  viewerCount: number;
  pinnedProduct: PinnedProduct | null;
  orders?: SessionOrder[];
  comments?: ChatComment[];
  remainingSeconds?: number;
};

const apiUrl = import.meta.env.VITE_API_URL;
const defaultOptions = ["Scale 1:64", "Premium Box"];

const formatCurrency = (price: number) => `${price.toLocaleString("vi-VN")}đ`;

export default function LiveStreamPlayerPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useContext(UserContext);
  const [liveState, setLiveState] = useState<LiveStatePayload>({
    isActive: false,
    viewerCount: 0,
    pinnedProduct: null,
    orders: [],
    comments: [],
  });
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatComment[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>(defaultOptions);
  const [quantity, setQuantity] = useState(1);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDealVisible, setIsDealVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [pinnedProductDetails, setPinnedProductDetails] = useState<ProductItem | null>(null);
  const [streamStatus, setStreamStatus] = useState<
    "idle" | "waiting" | "signaling" | "received" | "playing" | "error"
  >("idle");

  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const peerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const broadcasterSocketIdRef = useRef<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const socket = io(apiUrl, {
      auth: token ? { token: `Bearer ${token}` } : undefined,
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("JOIN_LIVE_AUDIENCE");
      setStatusMessage("Connected to Mini64 Live.");
      setStreamStatus("waiting");
    });

    socket.on("SYNC_LIVE_STATE", (payload: LiveStatePayload) => {
      setLiveState(payload);
      setChatMessages(payload.comments ?? []);
      setRemainingSeconds(payload.remainingSeconds ?? 0);
    });

    socket.on("SYNC_PRODUCT", (pinnedProduct: PinnedProduct | null) => {
      setLiveState((current) => ({
        ...current,
        isActive: !!pinnedProduct || current.isActive,
        pinnedProduct,
      }));

      if (pinnedProduct) {
        setQuantity(1);
        setSelectedOptions(
          pinnedProduct.options?.length ? pinnedProduct.options : defaultOptions,
        );
        setIsDealVisible(true);
        setStatusMessage(`Golden Hour deal is live for ${pinnedProduct.name}.`);
        return;
      }

      setIsDealVisible(false);
      setIsSheetOpen(false);
      setStatusMessage("Golden Hour deal ended. Waiting for the next drop.");
    });

    socket.on("STOCK_UPDATED", ({ stock }: { productId: string; stock: number }) => {
      setLiveState((current) => ({
        ...current,
        pinnedProduct: current.pinnedProduct
          ? { ...current.pinnedProduct, stock }
          : current.pinnedProduct,
      }));
    });

    socket.on("LIVE_CHAT_MESSAGE", (comment: ChatComment) => {
      setChatMessages((current) => [...current, comment].slice(-30));
    });

    socket.on("LIVE_BROADCAST_READY", () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      setStreamStatus("waiting");
      socket.emit("JOIN_LIVE_AUDIENCE");
      setStatusMessage("Broadcaster is ready. Re-syncing live stream...");
    });

    socket.on(
      "TICK",
      ({
        remainingSeconds: nextRemainingSeconds,
      }: {
        remainingSeconds: number;
        pinnedProductId: string | null;
      }) => {
        setRemainingSeconds(nextRemainingSeconds ?? 0);
      },
    );

    socket.on(
      "LIVE_SIGNAL",
      ({
        sourceSocketId,
        signal,
      }: {
        sourceSocketId: string;
        signal: any;
      }) => {
        const signalType = signal?.type;
        const isNewOffer = signalType === "offer";

        if (
          isNewOffer &&
          (broadcasterSocketIdRef.current !== sourceSocketId || peerRef.current)
        ) {
          if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
          }
          broadcasterSocketIdRef.current = sourceSocketId;
          setStreamStatus("signaling");
        }

        if (!peerRef.current) {
          setStreamStatus("signaling");
          const peer = new Peer({
            initiator: false,
            trickle: false,
          });

          peer.on("signal", (nextSignal: any) => {
            setStreamStatus("signaling");
            socketRef.current?.emit("WEBRTC_SIGNAL", {
              targetSocketId: sourceSocketId,
              signal: nextSignal,
            });
          });

          peer.on("stream", (stream: MediaStream) => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              setStreamStatus("received");
              void videoRef.current.play().then(
                () => {
                  setStreamStatus("playing");
                },
                () => {
                  setStreamStatus("received");
                },
              );
            }
          });

          peer.on("error", (error: Error) => {
            console.error(error);
            setErrorMessage(`Stream connection issue: ${error.message}`);
            setStreamStatus("error");
          });

          peer.on("close", () => {
            peerRef.current = null;
            broadcasterSocketIdRef.current = null;
            setStreamStatus("waiting");
          });

          peerRef.current = peer;
        }

        setStreamStatus("signaling");
        try {
          peerRef.current.signal(signal);
        } catch (error) {
          console.error(error);
          setErrorMessage("WebRTC signal state was invalid. Retrying live stream...");
          setStreamStatus("error");

          if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
          }
          broadcasterSocketIdRef.current = null;

          if (socketRef.current) {
            socketRef.current.emit("JOIN_LIVE_AUDIENCE");
          }
        }
      },
    );

    socket.on(
      "LIVE_PEER_LEFT",
      ({ socketId, role }: { socketId?: string; role?: "audience" | "broadcaster" }) => {
        const broadcasterLeft =
          role === "broadcaster" ||
          (!!socketId && socketId === broadcasterSocketIdRef.current);

        if (!broadcasterLeft) {
          return;
        }

      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      broadcasterSocketIdRef.current = null;
      setStreamStatus("waiting");
        setStatusMessage("Broadcaster disconnected. Waiting for the live stream to return.");
      },
    );

    socket.on("LIVE_ERROR", ({ message }: { message: string }) => {
      setErrorMessage(message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;

      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      broadcasterSocketIdRef.current = null;
    };
  }, []);

  useEffect(() => {
    const pinnedProductId = liveState.pinnedProduct?.id;

    if (!pinnedProductId) {
      setPinnedProductDetails(null);
      return;
    }

    let ignore = false;

    const fetchPinnedProductDetails = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/api/product/get-details/${pinnedProductId}`,
        );

        if (!ignore) {
          setPinnedProductDetails((response.data?.data as ProductItem | null) ?? null);
        }
      } catch (error) {
        console.error(error);
        if (!ignore) {
          setPinnedProductDetails(null);
        }
      }
    };

    void fetchPinnedProductDetails();

    return () => {
      ignore = true;
    };
  }, [liveState.pinnedProduct?.id]);

  useEffect(() => {
    if (!isDealVisible) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setIsDealVisible(false);
    }, 3600);

    return () => window.clearTimeout(timeout);
  }, [isDealVisible]);

  const pinnedProduct = liveState.pinnedProduct;
  const stockLeft = pinnedProduct?.stock ?? 0;
  const isSoldOut = stockLeft <= 0;
  const displayPrice = pinnedProduct
    ? getDisplayPrice(
        { id: pinnedProduct.id, originalPrice: pinnedProduct.originalPrice },
        pinnedProduct,
      )
    : 0;
  const orderTotal = useMemo(
    () => (pinnedProduct ? displayPrice * quantity : 0),
    [displayPrice, pinnedProduct, quantity],
  );

  const toggleOption = (option: string) => {
    setSelectedOptions((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option],
    );
  };

  const getCartScaleLabel = () => {
    const explicitScale = selectedOptions.find((option) =>
      option.toLowerCase().includes("scale"),
    );

    if (explicitScale) {
      return explicitScale;
    }

    const productText =
      `${pinnedProductDetails?.name ?? ""} ${pinnedProductDetails?.description ?? ""}`.toLowerCase();

    if (productText.includes("1:18")) return "1:18";
    if (productText.includes("1:43")) return "1:43";
    return "1:64";
  };

  const handlePlaceOrder = () => {
    if (!user) {
      setErrorMessage("Vui lòng đăng nhập để mua hàng.");
      navigate("/login");
      return;
    }

    if (!pinnedProduct || isSoldOut) {
      return;
    }

    setErrorMessage("");
    addToCart({
      productId: pinnedProduct.id,
      name: pinnedProduct.name,
      image: pinnedProductDetails?.image ?? "/favicon.png",
      price: displayPrice,
      amount: quantity,
      scale: getCartScaleLabel(),
      brand: pinnedProductDetails?.brand?.name ?? "Mini64",
      stock: stockLeft,
    });
    setIsSheetOpen(false);
    setStatusMessage("Đã thêm sản phẩm live vào giỏ hàng.");
    navigate("/cart");
  };

  const handleSendMessage = () => {
    const message = chatInput.trim();
    if (!message) {
      return;
    }

    socketRef.current?.emit("SEND_LIVE_CHAT_MESSAGE", { message });
    setChatInput("");
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1800px] flex-col overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_38%),linear-gradient(135deg,_#050816_0%,_#0b1120_45%,_#111827_100%)]">
        <div className="relative flex-1">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-[58vh] w-full bg-black object-cover md:h-[72vh]"
          />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050816] via-transparent to-black/20" />

          <div className="absolute left-4 top-4 right-4 flex items-center justify-between">
            <div className="rounded-full border border-white/10 bg-black/45 px-4 py-2 text-sm backdrop-blur-xl">
              <span className="inline-flex items-center gap-2 text-emerald-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.85)]" />
                Mini64 Live
              </span>
            </div>
            <div className="rounded-full border border-white/10 bg-black/45 px-4 py-2 text-sm text-slate-200 backdrop-blur-xl">
              {liveState.viewerCount} viewers
            </div>
          </div>

          <div className="absolute right-4 top-18 z-20 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 backdrop-blur-xl">
            Stream: {streamStatus}
          </div>

          {streamStatus !== "playing" ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="rounded-[28px] border border-white/10 bg-black/55 px-6 py-5 text-center backdrop-blur-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">
                  Live stream status
                </p>
                <p className="mt-3 text-lg font-bold text-white">
                  {streamStatus === "waiting" && "Waiting for broadcaster stream"}
                  {streamStatus === "signaling" && "Connecting to broadcaster"}
                  {streamStatus === "received" && "Stream received, trying to play"}
                  {streamStatus === "error" && "Stream connection error"}
                  {streamStatus === "idle" && "Joining live room"}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Nếu admin đã bật camera mà vẫn đứng ở đây, mình cần bắt tiếp tín hiệu WebRTC.
                </p>
              </div>
            </div>
          ) : null}

          <div className="absolute left-4 top-20 bottom-4 z-10 hidden w-[320px] flex-col rounded-[28px] border border-white/10 bg-black/25 p-4 shadow-2xl backdrop-blur-xl lg:flex">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-100">
              <MessageCircle className="h-4 w-4 text-indigo-300" />
              Live chat
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {chatMessages.length > 0 ? (
                chatMessages.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-2xl border border-white/10 bg-white/8 px-3 py-2"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                      {comment.author}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-100">
                      {comment.message}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-300">
                  Chat sẽ hiện ở đây khi phiên live bắt đầu sôi động hơn.
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSendMessage();
                  }
                }}
                placeholder="Type your comment..."
                className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 text-sm text-white outline-none placeholder:text-slate-300"
              />
              <button
                type="button"
                onClick={handleSendMessage}
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 text-white transition hover:bg-indigo-400"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isDealVisible && pinnedProduct ? (
              <motion.div
                initial={{ opacity: 0, y: 110 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 110 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="absolute inset-x-4 bottom-4 z-20 lg:left-[360px] lg:right-6"
              >
                <button
                  type="button"
                  onClick={() => setIsSheetOpen(true)}
                  className="w-full rounded-[30px] border border-amber-300/30 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 p-[1px] text-left shadow-[0_20px_80px_rgba(245,158,11,0.3)]"
                >
                  <div className="flex flex-col gap-4 rounded-[29px] bg-[#0b1020]/95 px-5 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
                        <Sparkles className="h-3.5 w-3.5" />
                        Golden Hour Deal
                      </div>
                      <h2 className="mt-3 text-xl font-bold text-white sm:text-2xl">
                        {pinnedProduct.name}
                      </h2>
                      <p className="mt-2 text-sm text-slate-300">
                        Flash Sale đang lên sóng. Nhấn để chọn option và thêm vào giỏ hàng.
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="inline-flex rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-rose-200">
                        Flash Sale
                      </span>
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatGoldenHourCountdown(remainingSeconds)}
                      </div>
                      <p className="mt-3 text-3xl font-black text-amber-300">
                        {formatCurrency(displayPrice)}
                      </p>
                      <p className="mt-1 text-sm text-slate-400 line-through">
                        {formatCurrency(pinnedProduct.originalPrice)}
                      </p>
                    </div>
                  </div>
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="grid gap-4 border-t border-white/10 bg-[#070b18]/90 px-4 py-5 backdrop-blur-xl md:grid-cols-[minmax(0,1fr)_360px] md:px-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-indigo-300">
                  Pinned Product
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  {pinnedProduct?.name ?? "Waiting for the next Golden Hour drop"}
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  {pinnedProduct
                    ? "Tap the deal card to open option selector and place an instant live order."
                    : "The admin has not pinned a product yet. We will sync it here automatically."}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Countdown
                  </p>
                  <p className="mt-1 text-lg font-bold text-amber-300">
                    {formatGoldenHourCountdown(remainingSeconds)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Stock
                  </p>
                  <p
                    className={`mt-1 text-lg font-bold ${
                      isSoldOut ? "text-rose-300" : "text-emerald-300"
                    }`}
                  >
                    {stockLeft} left
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSheetOpen(true)}
                  disabled={!pinnedProduct}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-indigo-500 px-5 font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {statusMessage ? (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                {statusMessage}
              </div>
            ) : null}
            {errorMessage ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                {errorMessage}
              </div>
            ) : null}
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">
                Session pulse
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Viewers
                  </p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {liveState.viewerCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Orders
                  </p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {liveState.orders?.length ?? 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 lg:hidden">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-100">
                <MessageCircle className="h-4 w-4 text-indigo-300" />
                Live chat
              </div>

              <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                {chatMessages.length > 0 ? (
                  chatMessages.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                        {comment.author}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-100">
                        {comment.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-300">
                    Chưa có bình luận nào trong phiên live này.
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type your comment..."
                  className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 text-sm text-white outline-none placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 text-white transition hover:bg-indigo-400"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isSheetOpen && pinnedProduct ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            >
              <div
                className="absolute inset-0"
                onClick={() => setIsSheetOpen(false)}
                aria-hidden="true"
              />

              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ duration: 0.32, ease: "easeOut" }}
                className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl rounded-t-[32px] border border-white/10 bg-[#0a1020] p-6 shadow-2xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber-300">
                      Flash Sale Checkout
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-white">
                      {pinnedProduct.name}
                    </h3>
                    <p className="mt-2 text-sm text-slate-300">
                      Chọn option live, xác nhận số lượng, rồi thêm vào giỏ trước khi checkout.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSheetOpen(false)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_240px]">
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      Product options
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {(pinnedProduct.options?.length ? pinnedProduct.options : defaultOptions).map(
                        (option) => {
                          const active = selectedOptions.includes(option);

                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => toggleOption(option)}
                              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                active
                                  ? "border-indigo-400 bg-indigo-500/20 text-indigo-100"
                                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                              }`}
                            >
                              {option}
                            </button>
                          );
                        },
                      )}
                    </div>

                    <div className="mt-6">
                      <p className="text-sm font-semibold text-slate-200">Quantity</p>
                      <div className="mt-3 inline-flex items-center rounded-2xl border border-white/10 bg-white/5 p-1">
                        <button
                          type="button"
                          onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-slate-200 transition hover:bg-white/10"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-16 text-center text-lg font-bold text-white">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity((current) =>
                              Math.min(Math.max(stockLeft, 1), current + 1),
                            )
                          }
                          disabled={isSoldOut}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">
                      Live summary
                    </p>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between text-sm text-slate-300">
                        <span>Golden Hour price</span>
                        <span className="font-semibold text-white">
                          {formatCurrency(displayPrice)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-300">
                        <span>Countdown</span>
                        <span className="font-semibold text-amber-300">
                          {formatGoldenHourCountdown(remainingSeconds)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-300">
                        <span>Quantity</span>
                        <span className="font-semibold text-white">{quantity}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-300">
                        <span>Stock remaining</span>
                        <span
                          className={`font-semibold ${
                            isSoldOut ? "text-rose-300" : "text-emerald-300"
                          }`}
                        >
                          {stockLeft}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.24em] text-amber-200">
                        Total
                      </p>
                      <p className="mt-2 text-3xl font-black text-amber-300">
                        {formatCurrency(orderTotal)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      disabled={isSoldOut}
                      className={`mt-5 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl font-semibold transition ${
                        isSoldOut
                          ? "cursor-not-allowed bg-slate-700 text-slate-300"
                          : "bg-emerald-500 text-white hover:bg-emerald-400"
                      }`}
                    >
                      {isSoldOut ? (
                        "SOLD OUT"
                      ) : (
                        <>
                          <ShoppingBag className="h-5 w-5" />
                          Add to Cart
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
