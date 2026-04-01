import crypto from "node:crypto";

const normalizeValue = (value) => value?.toString().trim() || "";
const normalizeBaseUrl = (value) => normalizeValue(value).replace(/\/+$/, "");

const isHttpUrl = (value) => {
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const slugify = (value) =>
  normalizeValue(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || `product-${Date.now()}`;

class CloudinaryService {
  getConfig() {
    const cloudName = normalizeValue(process.env.CLOUDINARY_CLOUD_NAME);
    const apiKey = normalizeValue(process.env.CLOUDINARY_API_KEY);
    const apiSecret = normalizeValue(process.env.CLOUDINARY_API_SECRET);
    const folder = normalizeValue(process.env.CLOUDINARY_FOLDER) || "mini64/products";

    return {
      cloudName,
      apiKey,
      apiSecret,
      folder,
      uploadUrl: cloudName
        ? `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
        : "",
    };
  }

  getMissingConfigMessage() {
    const config = this.getConfig();
    const missing = [];

    if (!config.cloudName) {
      missing.push("CLOUDINARY_CLOUD_NAME");
    }
    if (!config.apiKey) {
      missing.push("CLOUDINARY_API_KEY");
    }
    if (!config.apiSecret) {
      missing.push("CLOUDINARY_API_SECRET");
    }

    return missing.length
      ? `CLOUDINARY IS NOT CONFIGURED. Missing: ${missing.join(", ")}`
      : "";
  }

  isConfigured() {
    return !this.getMissingConfigMessage();
  }

  buildSignature(params, apiSecret) {
    const toSign = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    return crypto.createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex");
  }

  async uploadImageFromUrl(imageUrl, options = {}) {
    if (!this.isConfigured()) {
      return {
        status: "ERR",
        message: this.getMissingConfigMessage(),
      };
    }

    if (!isHttpUrl(imageUrl)) {
      return {
        status: "ERR",
        message: "IMAGE URL MUST BE A VALID HTTP/HTTPS URL",
      };
    }

    const sourceResponse = await fetch(imageUrl);

    if (!sourceResponse.ok) {
      return {
        status: "ERR",
        message: `KHONG THE TAI ANH GOC TU URL. HTTP ${sourceResponse.status}`,
      };
    }

    const contentType =
      sourceResponse.headers.get("content-type") || "application/octet-stream";
    const bytes = await sourceResponse.arrayBuffer();
    const blob = new Blob([bytes], { type: contentType });

    const config = this.getConfig();
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = options.publicId || `${slugify(options.fileName || "product")}-${timestamp}`;

    const signatureParams = {
      folder: config.folder,
      public_id: publicId,
      timestamp,
    };

    const signature = this.buildSignature(signatureParams, config.apiSecret);
    const formData = new FormData();

    formData.append("file", blob, `${publicId}.jpg`);
    formData.append("api_key", config.apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("folder", config.folder);
    formData.append("public_id", publicId);
    formData.append("signature", signature);

    const uploadResponse = await fetch(config.uploadUrl, {
      method: "POST",
      body: formData,
    });

    const payload = await uploadResponse.json().catch(() => ({}));

    if (!uploadResponse.ok) {
      return {
        status: "ERR",
        message:
          payload?.error?.message ||
          payload?.message ||
          `CLOUDINARY UPLOAD FAILED WITH STATUS ${uploadResponse.status}`,
      };
    }

    return {
      status: "OK",
      message: "UPLOAD SUCCESS",
      data: {
        secureUrl: payload?.secure_url || "",
        publicId: payload?.public_id || publicId,
        raw: payload,
      },
    };
  }
}

export default new CloudinaryService();
