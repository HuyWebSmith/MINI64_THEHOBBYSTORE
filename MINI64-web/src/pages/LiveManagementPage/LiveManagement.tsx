import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import axios, { isAxiosError } from "axios";
import PageMeta from "../../components/admin_component/common/PageMeta";
import PageBreadcrumb from "../../components/admin_component/common/PageBreadCrumb";
import ComponentCard from "../../components/admin_component/common/ComponentCard";
import LiveStreamEmbed from "../../components/live/LiveStreamEmbed";
import {
  build100msRoomLink,
  get100msEnvGuide,
  getDefault100msLinks,
  getStoredUserInfo,
} from "../../utils/liveStream";

const apiUrl = import.meta.env.VITE_API_URL;

interface ProductOption {
  _id: string;
  name: string;
  image: string;
  price: number;
  stock: number;
}

interface LiveSessionRecord {
  _id: string;
  title: string;
  description: string;
  status: "draft" | "live" | "ended";
  streamProvider?: "100ms";
  hostRoomLink?: string;
  viewerRoomLink?: string;
  products: ProductOption[];
  featuredProduct?: ProductOption | null;
  startedAt?: string | null;
  endedAt?: string | null;
}

const LiveManagement = () => {
  const currentUser = getStoredUserInfo();
  const default100msLinks = getDefault100msLinks(currentUser);
  const envGuide = get100msEnvGuide();

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSessionRecord[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hostRoomLink, setHostRoomLink] = useState(default100msLinks.hostRoomLink);
  const [viewerRoomLink, setViewerRoomLink] = useState(default100msLinks.viewerRoomLink);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const activeLiveSession =
    liveSessions.find((session) => session.status === "live") || null;
  const currentHostRoomLink = build100msRoomLink({
    roomLink:
      activeLiveSession?.hostRoomLink ||
      hostRoomLink ||
      default100msLinks.hostRoomLink,
    name: currentUser?.name || "Admin MINI64",
    userId: currentUser?._id || currentUser?.id || currentUser?.email,
  });
  const currentViewerRoomLink = build100msRoomLink({
    roomLink:
      activeLiveSession?.viewerRoomLink ||
      viewerRoomLink ||
      default100msLinks.viewerRoomLink,
    name: "Khach MINI64",
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      throw new Error("Ban can dang nhap admin de quan ly livestream.");
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchLiveData = async () => {
    try {
      setLoading(true);
      setError("");

      const [productsResponse, liveSessionsResponse] = await Promise.all([
        axios.get(`${apiUrl}/api/product/get-all`, {
          params: { limit: 100, page: 0 },
        }),
        axios.get(`${apiUrl}/api/live-session/get-all`, {
          headers: getAuthHeaders(),
        }),
      ]);

      setProducts(productsResponse.data?.data ?? []);
      setLiveSessions(liveSessionsResponse.data?.data ?? []);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Khong the tai du lieu livestream.",
        );
      } else {
        setError("Khong the tai du lieu livestream.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedProductIds([]);
    setHostRoomLink(default100msLinks.hostRoomLink);
    setViewerRoomLink(default100msLinks.viewerRoomLink);
  };

  const handleProductToggle = (productId: string) => {
    setSelectedProductIds((currentIds) =>
      currentIds.includes(productId)
        ? currentIds.filter((id) => id !== productId)
        : [...currentIds, productId],
    );
  };

  const handleCreateLiveSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      await axios.post(
        `${apiUrl}/api/live-session/create`,
        {
          title,
          description,
          products: selectedProductIds,
          streamProvider: "100ms",
          hostRoomLink,
          viewerRoomLink,
        },
        {
          headers: getAuthHeaders(),
        },
      );

      setSuccessMessage("Da tao phong livestream 100ms moi.");
      resetForm();
      fetchLiveData();
    } catch (err) {
      if (isAxiosError(err)) {
        const backendMessage = err.response?.data?.message;
        const fallbackMessage =
          err.response?.status === 404
            ? "API livestream chua san sang. Hay restart MINI64-api de nap route moi."
            : err.message;

        setError(
          backendMessage ||
            fallbackMessage ||
            "Khong the tao phong livestream.",
        );
      } else {
        setError("Khong the tao phong livestream.");
      }
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const updateLiveSession = async (
    action: "start" | "end" | "pin",
    sessionId: string,
    productId?: string,
  ) => {
    try {
      setError("");
      setSuccessMessage("");

      if (action === "pin") {
        await axios.post(
          `${apiUrl}/api/live-session/pin-product/${sessionId}`,
          {
            productId: productId || null,
          },
          {
            headers: getAuthHeaders(),
          },
        );
      } else {
        await axios.post(
          `${apiUrl}/api/live-session/${action}/${sessionId}`,
          {},
          {
            headers: getAuthHeaders(),
          },
        );
      }

      setSuccessMessage("Da cap nhat livestream.");
      fetchLiveData();
    } catch (err) {
      if (isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Khong the cap nhat livestream.",
        );
      } else {
        setError("Khong the cap nhat livestream.");
      }
      console.error(err);
    }
  };

  return (
    <>
      <PageMeta
        title="Livestream Management | Mini64 Hobby Store"
        description="Quan ly livestream va san pham dang ban"
      />
      <PageBreadcrumb pageTitle="Livestream Management" />

      <div className="space-y-6">
        <ComponentCard
          title="100ms tren website"
          desc="Admin co the host ngay trong dashboard, viewer xem truc tiep tai trang /live."
        >
          <div className="space-y-5">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100">
              <p className="font-semibold">Cach lay room link 100ms</p>
              <p className="mt-2">
                Vao 100ms dashboard, tao template livestream, sau do copy host room
                link va viewer room link. Theo 100ms Prebuilt, room code la cach
                join phong nhanh nhat; trong repo nay minh dang nhung phong vao web
                bang room link de de test tren localhost.
              </p>
              <p className="mt-2">
                Env hien tai: subdomain {envGuide.templateSubdomain || "chua co"},
                host code {envGuide.defaultHostRoomCode || "chua co"}, viewer code{" "}
                {envGuide.defaultViewerRoomCode || "chua co"}.
              </p>
            </div>

            <LiveStreamEmbed
              roomLink={currentHostRoomLink}
              title={
                activeLiveSession
                  ? `Host dang live: ${activeLiveSession.title}`
                  : "Host room 100ms"
              }
              description="Camera/mic cua admin se mo ngay trong khung nay neu browser cho phep. Neu ban muon thao tac day du hon, co the bam Mo tab rieng."
              emptyMessage="Chua co host room link. Dien host room link vao form tao livestream hoac cau hinh bien VITE_100MS_HOST_ROOM_LINK."
            />

            <div className="flex flex-wrap gap-3">
              {currentViewerRoomLink && (
                <a
                  href={currentViewerRoomLink}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Mo phong viewer trong tab moi
                </a>
              )}
              {currentHostRoomLink && (
                <a
                  href={currentHostRoomLink}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-400 dark:border-gray-700 dark:text-gray-200"
                >
                  Mo phong host trong tab moi
                </a>
              )}
            </div>
          </div>
        </ComponentCard>

        <ComponentCard
          title="Tao phong livestream"
          desc="Chon san pham cho buoi live, gan room link 100ms va tao phong de bat dau ban hang."
        >
          <form onSubmit={handleCreateLiveSession} className="space-y-5">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                {successMessage}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tieu de live
                </span>
                <input
                  value={title}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setTitle(event.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mo ta
                </span>
                <input
                  value={description}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setDescription(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Host room link 100ms
                </span>
                <input
                  value={hostRoomLink}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setHostRoomLink(event.target.value)
                  }
                  placeholder="https://your-template.app.100ms.live/meeting/host-room-code"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Viewer room link 100ms
                </span>
                <input
                  value={viewerRoomLink}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setViewerRoomLink(event.target.value)
                  }
                  placeholder="https://your-template.app.100ms.live/meeting/viewer-room-code"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </label>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                San pham tham gia livestream
              </p>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <label
                    key={product._id}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition ${
                      selectedProductIds.includes(product._id)
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20"
                        : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(product._id)}
                      onChange={() => handleProductToggle(product._id)}
                    />
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-14 w-14 rounded-xl object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900 dark:text-white/90">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {product.price.toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-400 dark:border-gray-700 dark:text-gray-200"
              >
                Dat lai
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Dang tao..." : "Tao livestream"}
              </button>
            </div>
          </form>
        </ComponentCard>

        <ComponentCard
          title="Danh sach livestream"
          desc="Bat dau, ket thuc va ghim san pham noi bat cho tung buoi live."
        >
          {loading ? (
            <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Dang tai danh sach livestream...
            </div>
          ) : (
            <div className="space-y-4">
              {liveSessions.map((session) => (
                <div
                  key={session._id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">
                          {session.title}
                        </h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            session.status === "live"
                              ? "bg-red-100 text-red-600 dark:bg-red-950/20 dark:text-red-300"
                              : session.status === "draft"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300"
                                : "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300"
                          }`}
                        >
                          {session.status.toUpperCase()}
                        </span>
                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-300">
                          {session.streamProvider || "100ms"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {session.description || "Khong co mo ta cho buoi live nay."}
                      </p>
                      {session.featuredProduct && (
                        <p className="mt-2 text-sm font-medium text-indigo-600 dark:text-indigo-300">
                          San pham dang ghim: {session.featuredProduct.name}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {session.hostRoomLink && (
                          <a
                            href={build100msRoomLink({
                              roomLink: session.hostRoomLink,
                              name: currentUser?.name || "Admin MINI64",
                              userId:
                                currentUser?._id ||
                                currentUser?.id ||
                                currentUser?.email,
                            })}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200"
                          >
                            Mo host room
                          </a>
                        )}
                        {session.viewerRoomLink && (
                          <a
                            href={build100msRoomLink({
                              roomLink: session.viewerRoomLink,
                              name: "Khach MINI64",
                            })}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200"
                          >
                            Mo viewer room
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => updateLiveSession("start", session._id)}
                        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                      >
                        Bat dau live
                      </button>
                      <button
                        onClick={() => updateLiveSession("end", session._id)}
                        className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400 dark:border-gray-700 dark:text-gray-200"
                      >
                        Ket thuc
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {session.products.map((product) => (
                      <div
                        key={product._id}
                        className={`rounded-2xl border p-4 ${
                          session.featuredProduct?._id === product._id
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20"
                            : "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-16 w-16 rounded-xl object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-900 dark:text-white/90">
                              {product.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {product.price.toLocaleString("vi-VN")}đ
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() =>
                              updateLiveSession("pin", session._id, product._id)
                            }
                            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                          >
                            {session.featuredProduct?._id === product._id
                              ? "Dang ghim"
                              : "Ghim san pham"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {!liveSessions.length && (
                <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  Chua co phong livestream nao.
                </div>
              )}
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
};

export default LiveManagement;
