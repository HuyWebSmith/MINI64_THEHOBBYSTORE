import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Peer from "simple-peer/simplepeer.min.js";
import { io } from "socket.io-client";
import {
  AlertTriangle,
  Camera,
  Clock3,
  Power,
  MonitorUp,
  Package,
  RadioTower,
  Search,
  ShoppingBag,
  Users,
} from "lucide-react";
import PageMeta from "../components/admin_component/common/PageMeta";
import ComponentCard from "../components/admin_component/common/ComponentCard";

type ProductItem = {
  _id: string;
  name: string;
  image: string;
  price: number;
  stock: number;
  brand?: {
    _id?: string;
    name?: string;
  } | null;
};

type SessionOrder = {
  id: string;
  productId: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
  userId?: string | null;
};

type PinnedProduct = {
  id: string;
  name: string;
  originalPrice: number;
  tempPrice: number;
  stock: number;
  options: string[];
  goldenHourDuration?: number;
};

type LiveStatePayload = {
  isActive: boolean;
  viewerCount: number;
  pinnedProduct: PinnedProduct | null;
  orders?: SessionOrder[];
  remainingSeconds?: number;
};

const apiUrl = import.meta.env.VITE_API_URL;

const formatCurrency = (price: number) => `${price.toLocaleString("vi-VN")}đ`;

export default function LiveStreamAdminPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [tempPrice, setTempPrice] = useState("");
  const [limitedStock, setLimitedStock] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("5");
  const [sessionState, setSessionState] = useState<LiveStatePayload>({
    isActive: false,
    viewerCount: 0,
    pinnedProduct: null,
    orders: [],
  });
  const [recentOrders, setRecentOrders] = useState<SessionOrder[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [startingStream, setStartingStream] = useState(false);
  const [pushingProduct, setPushingProduct] = useState(false);
  const [endingLive, setEndingLive] = useState(false);
  const [updatingDeal, setUpdatingDeal] = useState(false);
  const [streamMode, setStreamMode] = useState<"screen" | "camera" | null>(null);
  const [peerStatus, setPeerStatus] = useState("Waiting for viewers");

  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const peersRef = useRef<Map<string, any>>(new Map());
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/product/get-all`, {
          params: {
            limit: 100,
            page: 0,
          },
        });

        setProducts(response.data?.data ?? []);
      } catch (error) {
        console.error(error);
        setErrorMessage("Could not load Mini64 products for the live room.");
      } finally {
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const socket = io(apiUrl, {
      auth: token ? { token: `Bearer ${token}` } : undefined,
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("ADMIN_REGISTER_BROADCASTER");
      setStatusMessage("Socket connected. Broadcaster room is ready.");
      setPeerStatus("Broadcaster socket connected");
    });

    socket.on("SYNC_LIVE_STATE", (payload: LiveStatePayload) => {
      setSessionState(payload);
      setRecentOrders((payload.orders ?? []).slice().reverse());
      if (payload.pinnedProduct?.goldenHourDuration) {
        setDurationMinutes(
          String(Math.max(1, Math.round(payload.pinnedProduct.goldenHourDuration / 60))),
        );
      }
    });

    socket.on("SYNC_PRODUCT", (pinnedProduct: PinnedProduct | null) => {
      setSessionState((current) => ({
        ...current,
        pinnedProduct,
      }));
      if (pinnedProduct) {
        setStatusMessage(`Pinned product synced: ${pinnedProduct.name}`);
        setTempPrice(String(pinnedProduct.tempPrice));
        if (pinnedProduct.goldenHourDuration) {
          setDurationMinutes(
            String(Math.max(1, Math.round(pinnedProduct.goldenHourDuration / 60))),
          );
        }
      } else {
        setStatusMessage("Live deal ended.");
      }
    });

    socket.on("STOCK_UPDATED", ({ stock }: { productId: string; stock: number }) => {
      setSessionState((current) => ({
        ...current,
        pinnedProduct: current.pinnedProduct
          ? { ...current.pinnedProduct, stock }
          : current.pinnedProduct,
      }));
    });

    socket.on("NEW_ORDER_ALERT", (order: SessionOrder) => {
      setRecentOrders((current) => [order, ...current].slice(0, 12));
    });

    socket.on("LIVE_VIEWER_JOINED", ({ viewerSocketId }: { viewerSocketId: string }) => {
      setPeerStatus(`Viewer joined: ${viewerSocketId.slice(-6)}`);
      const stream = streamRef.current;
      if (!stream) {
        setPeerStatus("Viewer joined but local stream is not ready yet");
        return;
      }

      if (!socketRef.current) {
        setPeerStatus("Viewer joined but broadcaster socket is unavailable");
        return;
      }

      const existingPeer = peersRef.current.get(viewerSocketId);
      if (existingPeer) {
        existingPeer.destroy();
        peersRef.current.delete(viewerSocketId);
        setPeerStatus(`Resetting peer for ${viewerSocketId.slice(-6)}`);
      }

      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream,
      });

      peer.on("signal", (signal: any) => {
        setPeerStatus(`Sending WebRTC signal to ${viewerSocketId.slice(-6)}`);
        socketRef.current?.emit("WEBRTC_SIGNAL", {
          targetSocketId: viewerSocketId,
          signal,
        });
      });

      peer.on("connect", () => {
        setPeerStatus(`Peer connected to ${viewerSocketId.slice(-6)}`);
      });

      peer.on("error", (error: Error) => {
        console.error(error);
        setErrorMessage(`Peer connection error: ${error.message}`);
        setPeerStatus(`Peer error for ${viewerSocketId.slice(-6)}: ${error.message}`);
      });

      peer.on("close", () => {
        peersRef.current.delete(viewerSocketId);
        setPeerStatus("Viewer peer closed");
      });

      peersRef.current.set(viewerSocketId, peer);
    });

    socket.on(
      "LIVE_SIGNAL",
      ({
        sourceSocketId,
        signal,
      }: {
        sourceSocketId: string;
        signal: any;
      }) => {
        const peer = peersRef.current.get(sourceSocketId);
        if (peer) {
          setPeerStatus(`Received return signal from ${sourceSocketId.slice(-6)}`);
          peer.signal(signal);
        }
      },
    );

    socket.on("LIVE_PEER_LEFT", ({ socketId }: { socketId: string }) => {
      const peer = peersRef.current.get(socketId);
      if (peer) {
        peer.destroy();
        peersRef.current.delete(socketId);
      }
      setPeerStatus("Viewer left live room");
    });

    socket.on("LIVE_ERROR", ({ message }: { message: string }) => {
      setErrorMessage(message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;

      peersRef.current.forEach((peer) => peer.destroy());
      peersRef.current.clear();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return products;
    }

    return products.filter((product) =>
      `${product.name} ${product.brand?.name ?? ""}`
        .toLowerCase()
        .includes(keyword),
    );
  }, [products, searchTerm]);

  const selectedProduct = useMemo(
    () => products.find((product) => product._id === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  const stockDanger = (sessionState.pinnedProduct?.stock ?? 0) < 3;
  const canSwitchNext =
    !!sessionState.pinnedProduct && sessionState.pinnedProduct.stock <= 0;
  const remainingMinutes = Math.max(
    1,
    Math.round((sessionState.remainingSeconds ?? 0) / 60) || Number(durationMinutes) || 5,
  );

  const attachPreviewStream = (stream: MediaStream) => {
    streamRef.current = stream;
    if (previewVideoRef.current) {
      previewVideoRef.current.srcObject = stream;
    }
  };

  const restartPeersWithStream = () => {
    peersRef.current.forEach((peer) => peer.destroy());
    peersRef.current.clear();

    setStatusMessage(
      "Broadcast stream is live. New viewers will receive the updated stream.",
    );
  };

  const startBroadcast = async (mode: "screen" | "camera") => {
    try {
      setStartingStream(true);
      setErrorMessage("");

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream =
        mode === "screen"
          ? await navigator.mediaDevices.getDisplayMedia({
              video: true,
              audio: true,
            })
          : await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true,
            });

      attachPreviewStream(stream);
      restartPeersWithStream();
      setStreamMode(mode);
      setPeerStatus("Local stream started, syncing audience");

      socketRef.current?.emit("ADMIN_START_LIVE");
      socketRef.current?.emit("ADMIN_REGISTER_BROADCASTER");
      socketRef.current?.emit("ADMIN_RESYNC_AUDIENCE");
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not start the broadcaster stream.");
    } finally {
      setStartingStream(false);
    }
  };

  const handlePushToLive = async () => {
    if (!selectedProduct) {
      setErrorMessage("Pick a Mini64 product first.");
      return;
    }

    if (Number(tempPrice) <= 0) {
      setErrorMessage("Temporary sale price must be greater than zero.");
      return;
    }

    if (Number(limitedStock) < 0) {
      setErrorMessage("Limited stock must be zero or greater.");
      return;
    }

    if (Number(durationMinutes) <= 0) {
      setErrorMessage("Golden Hour duration must be greater than zero.");
      return;
    }

    try {
      setPushingProduct(true);
      setErrorMessage("");

      socketRef.current?.emit("ADMIN_PIN_PRODUCT", {
        productId: selectedProduct._id,
        goldenHourPrice: Number(tempPrice),
        durationSeconds: Number(durationMinutes) * 60,
      });

      socketRef.current?.emit("ADMIN_UPDATE_STOCK", {
        productId: selectedProduct._id,
        stock: Number(limitedStock),
      });

      setStatusMessage(`${selectedProduct.name} was pushed to the live room.`);
    } finally {
      setPushingProduct(false);
    }
  };

  const handleUpdatePinnedDeal = async () => {
    if (!sessionState.pinnedProduct) {
      setErrorMessage("There is no pinned product to update.");
      return;
    }

    if (Number(tempPrice) <= 0 || Number(durationMinutes) <= 0) {
      setErrorMessage("Price and Golden Hour duration must be greater than zero.");
      return;
    }

    try {
      setUpdatingDeal(true);
      setErrorMessage("");

      socketRef.current?.emit("ADMIN_UPDATE_PINNED_DEAL", {
        productId: sessionState.pinnedProduct.id,
        goldenHourPrice: Number(tempPrice),
        durationSeconds: Number(durationMinutes) * 60,
      });

      socketRef.current?.emit("ADMIN_UPDATE_STOCK", {
        productId: sessionState.pinnedProduct.id,
        stock: Number(limitedStock || sessionState.pinnedProduct.stock),
      });

      setStatusMessage("Pinned deal updated.");
    } finally {
      setUpdatingDeal(false);
    }
  };

  const handleEndLive = async () => {
    try {
      setEndingLive(true);
      setErrorMessage("");

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      peersRef.current.forEach((peer) => peer.destroy());
      peersRef.current.clear();

      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = null;
      }

      socketRef.current?.emit("ADMIN_END_LIVE");
      setStreamMode(null);
      setPeerStatus("Live session ended");
      setStatusMessage("Live session ended.");
    } finally {
      setEndingLive(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Mini64 Live Stream Admin"
        description="Control room for Mini64 live stream commerce sessions."
      />

      <div className="space-y-6">
        <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-900 via-gray-950 to-indigo-950 p-6 text-white shadow-theme-xl dark:border-gray-800">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
                Mini64 Live Control
              </p>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                Live Stream Commerce Dashboard
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-300">
                Run the broadcast, push limited-time products, and watch stock and
                orders in real time without leaving the admin panel.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-gray-400">
                  Status
                </p>
                <p className="mt-2 text-lg font-semibold text-emerald-300">
                  {sessionState.isActive ? "Live" : "Offline"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-gray-400">
                  Viewers
                </p>
                <p className="mt-2 text-lg font-semibold">{sessionState.viewerCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-gray-400">
                  Orders
                </p>
                <p className="mt-2 text-lg font-semibold">{recentOrders.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-gray-400">
                  Stream
                </p>
                <p className="mt-2 text-lg font-semibold capitalize">
                  {streamMode ?? "idle"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {statusMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            {statusMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-7">
            <ComponentCard
              title="WebRTC Broadcaster"
              desc="Start a camera or screen-share stream. Every new viewer peer will receive a direct WebRTC feed from this admin session."
            >
              <div className="space-y-5">
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-950 dark:border-gray-800">
                  <video
                    ref={previewVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="aspect-video w-full bg-black object-cover"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => startBroadcast("screen")}
                    disabled={startingStream}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <MonitorUp className="h-5 w-5" />
                    Share Screen
                  </button>
                  <button
                    type="button"
                    onClick={() => startBroadcast("camera")}
                    disabled={startingStream}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Camera className="h-5 w-5" />
                    Start Camera
                  </button>
                  <button
                    type="button"
                    onClick={handleEndLive}
                    disabled={endingLive || (!sessionState.isActive && !streamRef.current)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Power className="h-5 w-5" />
                    End Live
                  </button>
                </div>

                <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm font-medium text-indigo-100">
                  {peerStatus}
                </div>
              </div>
            </ComponentCard>
          </div>

          <div className="col-span-12 xl:col-span-5">
            <ComponentCard
              title="Control Panel"
              desc="Pick the next product, set the Golden Hour pricing, and control limited stock for the live room."
            >
              <div className="space-y-5">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search Mini64 products..."
                    className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-12 pr-4 text-sm outline-none transition focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <select
                  value={selectedProductId}
                  onChange={(event) => {
                    const product = products.find(
                      (item) => item._id === event.target.value,
                    );
                    setSelectedProductId(event.target.value);
                    setTempPrice(product ? String(product.price) : "");
                    setLimitedStock(product ? String(product.stock) : "");
                  }}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Select product to push</option>
                  {filteredProducts.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name} • {product.brand?.name ?? "Mini64"}
                    </option>
                  ))}
                </select>

                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="number"
                    min="0"
                    value={tempPrice}
                    onChange={(event) => setTempPrice(event.target.value)}
                    placeholder="Temporary sale price"
                    className="h-12 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                  <input
                    type="number"
                    min="0"
                    value={limitedStock}
                    onChange={(event) => setLimitedStock(event.target.value)}
                    placeholder="Limited stock quantity"
                    className="h-12 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <div className="relative">
                  <Clock3 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    min="1"
                    value={durationMinutes}
                    onChange={(event) => setDurationMinutes(event.target.value)}
                    placeholder="Golden Hour duration (minutes)"
                    className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-12 pr-4 text-sm outline-none transition focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>

                {selectedProduct ? (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-center gap-4">
                      <img
                        src={selectedProduct.image}
                        alt={selectedProduct.name}
                        className="h-16 w-16 rounded-2xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-gray-800 dark:text-white">
                          {selectedProduct.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedProduct.brand?.name ?? "Mini64"} • Base stock{" "}
                          {selectedProduct.stock}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handlePushToLive}
                  disabled={!selectedProduct || pushingProduct}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <RadioTower className="h-5 w-5" />
                    PUSH TO LIVE
                </button>

                {sessionState.pinnedProduct ? (
                  <button
                    type="button"
                    onClick={handleUpdatePinnedDeal}
                    disabled={updatingDeal}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-5 py-3 font-semibold text-indigo-300 transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Clock3 className="h-5 w-5" />
                    Update Pinned Deal
                  </button>
                ) : null}

                {canSwitchNext ? (
                  <button
                    type="button"
                    onClick={handlePushToLive}
                    disabled={!selectedProduct || pushingProduct}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-3 font-semibold text-amber-300 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RadioTower className="h-5 w-5" />
                    Switch Next
                  </button>
                ) : null}
              </div>
            </ComponentCard>
          </div>

          <div className="col-span-12 xl:col-span-4">
            <ComponentCard
              title="Pinned Product"
              desc="Current product synced to the audience."
            >
              {sessionState.pinnedProduct ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                    <p className="text-lg font-semibold text-gray-800 dark:text-white">
                      {sessionState.pinnedProduct.name}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-gray-400">
                          Golden Hour
                        </p>
                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(sessionState.pinnedProduct.tempPrice)}
                        </p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-500 dark:text-amber-300">
                          {remainingMinutes} min configured
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.24em] text-gray-400">
                          Original
                        </p>
                        <p className="text-sm font-semibold text-gray-500 line-through dark:text-gray-400">
                          {formatCurrency(sessionState.pinnedProduct.originalPrice)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`rounded-2xl border px-4 py-3 ${
                      stockDanger
                        ? "border-red-500/30 bg-red-500/10 text-red-300"
                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 font-semibold">
                        {stockDanger ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <Package className="h-4 w-4" />
                        )}
                        Stock Warning
                      </span>
                      <span className="text-lg font-bold">
                        {sessionState.pinnedProduct.stock} left
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                  No product pinned yet.
                </div>
              )}
            </ComponentCard>
          </div>

          <div className="col-span-12 xl:col-span-3">
            <ComponentCard
              title="Audience Pulse"
              desc="Live audience metrics from Socket.io."
            >
              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-indigo-500" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-gray-400">
                        Current viewers
                      </p>
                      <p className="mt-1 text-3xl font-bold text-gray-800 dark:text-white">
                        {sessionState.viewerCount}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-gray-400">
                        Session orders
                      </p>
                      <p className="mt-1 text-3xl font-bold text-gray-800 dark:text-white">
                        {recentOrders.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ComponentCard>
          </div>

          <div className="col-span-12 xl:col-span-5">
            <ComponentCard
              title="Sales Tracker"
              desc="Recent orders placed during the current live session."
            >
              {recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">
                            Order #{order.id.slice(-6).toUpperCase()}
                          </p>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Qty {order.quantity} • {formatCurrency(order.totalPrice)}
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                          Live Sale
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                  No live orders yet in this session.
                </div>
              )}
            </ComponentCard>
          </div>
        </div>
      </div>
    </>
  );
}
