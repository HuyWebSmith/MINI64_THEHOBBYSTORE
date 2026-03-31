const templateSubdomain = import.meta.env.VITE_100MS_TEMPLATE_SUBDOMAIN?.trim();
const defaultHostRoomCode = import.meta.env.VITE_100MS_HOST_ROOM_CODE?.trim();
const defaultViewerRoomCode = import.meta.env.VITE_100MS_VIEWER_ROOM_CODE?.trim();
const defaultHostRoomLink = import.meta.env.VITE_100MS_HOST_ROOM_LINK?.trim();
const defaultViewerRoomLink = import.meta.env.VITE_100MS_VIEWER_ROOM_LINK?.trim();

interface StoredUserInfo {
  _id?: string;
  id?: string;
  email?: string;
  name?: string;
}

interface BuildRoomLinkOptions {
  roomLink?: string | null;
  roomCode?: string | null;
  name?: string | null;
  userId?: string | null;
}

const normalizeUrl = (value?: string | null) => value?.trim() || "";

export const getStoredUserInfo = (): StoredUserInfo | null => {
  const rawValue = localStorage.getItem("user_info");

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as StoredUserInfo;
  } catch (error) {
    console.error("Cannot parse stored user info", error);
    return null;
  }
};

export const build100msRoomLink = ({
  roomLink,
  roomCode,
  name,
  userId,
}: BuildRoomLinkOptions) => {
  const normalizedRoomLink = normalizeUrl(roomLink);
  const normalizedRoomCode = normalizeUrl(roomCode);

  let urlString = normalizedRoomLink;

  if (!urlString && templateSubdomain && normalizedRoomCode) {
    urlString = `https://${templateSubdomain}.app.100ms.live/meeting/${normalizedRoomCode}`;
  }

  if (!urlString) {
    return "";
  }

  try {
    const url = new URL(urlString);

    if (name) {
      url.searchParams.set("name", name);
    }

    if (userId) {
      url.searchParams.set("userId", userId);
    }

    return url.toString();
  } catch (error) {
    console.error("Cannot build 100ms room link", error);
    return "";
  }
};

export const getDefault100msLinks = (user?: StoredUserInfo | null) => ({
  hostRoomLink: build100msRoomLink({
    roomLink: defaultHostRoomLink,
    roomCode: defaultHostRoomCode,
    name: user?.name || "Admin MINI64",
    userId: user?._id || user?.id || user?.email || "admin-mini64",
  }),
  viewerRoomLink: build100msRoomLink({
    roomLink: defaultViewerRoomLink,
    roomCode: defaultViewerRoomCode,
    name: user?.name || "Khach MINI64",
    userId: user?._id || user?.id || user?.email || "viewer-mini64",
  }),
  isConfigured: Boolean(
    defaultHostRoomLink ||
      defaultViewerRoomLink ||
      (templateSubdomain && defaultHostRoomCode && defaultViewerRoomCode),
  ),
});

export const get100msEnvGuide = () => ({
  templateSubdomain,
  defaultHostRoomCode,
  defaultViewerRoomCode,
  defaultHostRoomLink,
  defaultViewerRoomLink,
});
