interface LiveStreamEmbedProps {
  description: string;
  emptyMessage: string;
  overlayActionLabel?: string;
  overlayBusy?: boolean;
  overlayHint?: string;
  overlayProduct?: {
    image: string;
    name: string;
    price: number;
    rating?: number;
    stock: number;
  } | null;
  onOverlayAction?: () => void;
  roomLink?: string | null;
  title: string;
}

const LiveStreamEmbed = ({
  description,
  emptyMessage,
  overlayActionLabel = "Them vao gio",
  overlayBusy = false,
  overlayHint = "San pham dang ghim",
  overlayProduct,
  onOverlayAction,
  roomLink,
  title,
}: LiveStreamEmbedProps) => {
  if (!roomLink) {
    return (
      <div className="rounded-[28px] border border-dashed border-white/20 bg-white/5 p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/50">
          100ms Prebuilt
        </p>
        <h3 className="mt-4 text-2xl font-bold text-white">{title}</h3>
        <p className="mt-3 text-sm text-white/65">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/50">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-themeYellow">
            100ms Prebuilt
          </p>
          <h3 className="mt-1 text-xl font-bold text-white">{title}</h3>
        </div>
        <a
          href={roomLink}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Mo tab rieng
        </a>
      </div>
      <div className="border-b border-white/10 px-5 py-3 text-sm text-white/65">
        {description}
      </div>
      <div className="relative">
        <iframe
          key={roomLink}
          src={roomLink}
          title={title}
          className="h-[560px] w-full bg-black"
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          referrerPolicy="strict-origin-when-cross-origin"
        />

        {overlayProduct && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <div className="pointer-events-auto max-w-md rounded-[28px] border border-white/15 bg-black/75 p-4 shadow-2xl backdrop-blur-md">
              <div className="flex gap-3">
                <img
                  src={overlayProduct.image}
                  alt={overlayProduct.name}
                  className="h-20 w-20 rounded-[20px] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-themeYellow">
                    {overlayHint}
                  </p>
                  <h4 className="mt-2 line-clamp-2 text-base font-bold text-white">
                    {overlayProduct.name}
                  </h4>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/70">
                    <span className="text-lg font-bold text-themeYellow">
                      {overlayProduct.price.toLocaleString("vi-VN")}đ
                    </span>
                    <span>Ton kho: {overlayProduct.stock}</span>
                    {typeof overlayProduct.rating === "number" && (
                      <span>Rating: {overlayProduct.rating.toFixed(1)}</span>
                    )}
                  </div>
                </div>
              </div>

              {onOverlayAction && (
                <button
                  type="button"
                  onClick={onOverlayAction}
                  disabled={overlayBusy}
                  className="mt-4 w-full rounded-2xl bg-themeYellow px-4 py-3 text-sm font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {overlayBusy ? "Dang them..." : overlayActionLabel}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveStreamEmbed;
