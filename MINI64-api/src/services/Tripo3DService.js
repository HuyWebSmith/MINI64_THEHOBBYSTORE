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

const toTripoCompatibleImageUrl = (value) => {
  const normalized = normalizeValue(value);

  if (!normalized.includes("res.cloudinary.com")) {
    return normalized;
  }

  return normalized.replace("/image/upload/", "/image/upload/f_jpg,q_auto/");
};

class Tripo3DService {
  getConfig() {
    const apiBaseUrl = normalizeBaseUrl(process.env.TRIPO_API_BASE_URL);
    const createTaskPath = normalizeValue(process.env.TRIPO_CREATE_TASK_PATH) || "/task";
    const taskStatusPathTemplate =
      normalizeValue(process.env.TRIPO_TASK_STATUS_PATH_TEMPLATE) || "/task/{taskId}";

    const apiKey = normalizeValue(process.env.TRIPO_API_KEY);
    const apiKeyHeader = normalizeValue(process.env.TRIPO_API_KEY_HEADER) || "Authorization";
    const apiKeyPrefix = normalizeValue(process.env.TRIPO_API_KEY_PREFIX) || "Bearer";

    const clientId = normalizeValue(process.env.TRIPO_CLIENT_ID);
    const clientSecret = normalizeValue(process.env.TRIPO_CLIENT_SECRET);
    const tokenUrl = normalizeValue(process.env.TRIPO_TOKEN_URL);
    const tokenMethod = normalizeValue(process.env.TRIPO_TOKEN_METHOD) || "POST";
    const tokenClientIdField =
      normalizeValue(process.env.TRIPO_TOKEN_CLIENT_ID_FIELD) || "client_id";
    const tokenClientSecretField =
      normalizeValue(process.env.TRIPO_TOKEN_CLIENT_SECRET_FIELD) || "client_secret";
    const tokenGrantTypeField =
      normalizeValue(process.env.TRIPO_TOKEN_GRANT_TYPE_FIELD) || "grant_type";
    const tokenGrantType =
      normalizeValue(process.env.TRIPO_TOKEN_GRANT_TYPE) || "client_credentials";

    const directApiKeyConfigured = Boolean(apiKey);
    const oauthConfigured = Boolean(clientId && clientSecret && tokenUrl);
    const authMode = directApiKeyConfigured
      ? "api_key"
      : oauthConfigured
        ? "oauth_client_credentials"
        : "missing";

    return {
      apiBaseUrl,
      createTaskPath,
      taskStatusPathTemplate,
      apiKey,
      apiKeyHeader,
      apiKeyPrefix,
      clientId,
      clientSecret,
      tokenUrl,
      tokenMethod,
      tokenClientIdField,
      tokenClientSecretField,
      tokenGrantTypeField,
      tokenGrantType,
      authMode,
    };
  }

  getMissingConfigMessage() {
    const config = this.getConfig();
    const missing = [];

    if (!config.apiBaseUrl) {
      missing.push("TRIPO_API_BASE_URL");
    }

    if (config.authMode === "missing") {
      if (config.clientId && !config.clientSecret) {
        missing.push("TRIPO_CLIENT_SECRET");
      }

      if (config.clientId && !config.tokenUrl) {
        missing.push("TRIPO_TOKEN_URL");
      }

      if (!config.clientId && !config.apiKey) {
        missing.push("TRIPO_API_KEY hoac TRIPO_CLIENT_ID");
      }

      if (!config.clientSecret && !config.apiKey) {
        missing.push("TRIPO_CLIENT_SECRET hoac TRIPO_API_KEY");
      }

      if (!config.tokenUrl && !config.apiKey) {
        missing.push("TRIPO_TOKEN_URL hoac TRIPO_API_KEY");
      }
    }

    if (config.apiKey.startsWith("tcli_")) {
      return "TRIPO_API_KEY hien dang la Client ID (bat dau bang tcli_), khong phai secret key. Hay dung secret key that cua Tripo, thuong co dang tsk_..., cho TRIPO_API_KEY.";
    }

    const uniqueMissing = [...new Set(missing)].filter(Boolean);

    if (!uniqueMissing.length) {
      return "TRIPO 3D IS NOT CONFIGURED";
    }

    return `TRIPO 3D IS NOT CONFIGURED. Missing: ${uniqueMissing.join(", ")}`;
  }

  createTaskUrl() {
    const { apiBaseUrl, createTaskPath } = this.getConfig();
    return `${apiBaseUrl}${createTaskPath.startsWith("/") ? createTaskPath : `/${createTaskPath}`}`;
  }

  getTaskUrl(taskId) {
    const { apiBaseUrl, taskStatusPathTemplate } = this.getConfig();
    const normalizedPath = taskStatusPathTemplate.replace("{taskId}", taskId);
    return `${apiBaseUrl}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
  }

  extractTaskId(payload) {
    return (
      payload?.data?.task_id ||
      payload?.data?.taskId ||
      payload?.data?.id ||
      payload?.task_id ||
      payload?.taskId ||
      payload?.id ||
      ""
    );
  }

  extractAccessToken(payload) {
    return (
      payload?.access_token ||
      payload?.token ||
      payload?.data?.access_token ||
      payload?.data?.token ||
      ""
    );
  }

  extractProviderStatus(payload) {
    return (
      payload?.data?.status ||
      payload?.data?.state ||
      payload?.status ||
      payload?.state ||
      ""
    )
      .toString()
      .toLowerCase();
  }

  extractModelUrl(payload) {
    return (
      payload?.data?.output?.model ||
      payload?.data?.output?.pbr_model ||
      payload?.data?.output?.base_model ||
      payload?.data?.model_url ||
      payload?.data?.modelUrl ||
      payload?.data?.output?.model_url ||
      payload?.data?.output?.modelUrl ||
      payload?.data?.result?.model_url ||
      payload?.data?.result?.modelUrl ||
      payload?.model_url ||
      payload?.modelUrl ||
      payload?.output?.model ||
      payload?.output?.pbr_model ||
      payload?.output?.base_model ||
      payload?.output?.model_url ||
      payload?.output?.modelUrl ||
      payload?.result?.model_url ||
      payload?.result?.modelUrl ||
      ""
    );
  }

  buildCandidateCreatePayloads(product) {
    const modelVersion = normalizeValue(process.env.TRIPO_MODEL_VERSION);
    const outputFormat = process.env.TRIPO_OUTPUT_FORMAT || "glb";
    const compatibleImageUrl = toTripoCompatibleImageUrl(product.image);
    const file = {
      type: "jpg",
      url: compatibleImageUrl,
    };

    const candidates = [
      {
        type: "image_to_model",
        file,
      },
      {
        type: "image_to_model",
        file,
        pbr: true,
        texture: true,
      },
      {
        type: "image_to_model",
        file,
        pbr: true,
        texture: true,
        texture_alignment: "original_image",
        texture_quality: "standard",
        geometry_quality: "standard",
        orientation: "default",
      },
      {
        type: "image_to_model",
        file,
        pbr: true,
        texture: true,
        texture_alignment: "original_image",
        texture_quality: "detailed",
        geometry_quality: "detailed",
        face_limit: 100000,
      },
      {
        type: "image_to_model",
        image_url: compatibleImageUrl,
        output_format: outputFormat,
      },
    ];

    return candidates.map((candidate) => {
      if (modelVersion) {
        return { ...candidate, model_version: modelVersion };
      }
      return candidate;
    });
  }

  mapStatus(providerStatus) {
    if (
      ["succeeded", "success", "completed", "done", "ready", "finished"].includes(
        providerStatus,
      )
    ) {
      return "ready";
    }

    if (
      ["failed", "error", "cancelled", "canceled", "expired"].includes(
        providerStatus,
      )
    ) {
      return "failed";
    }

    if (
      ["queued", "pending", "running", "processing", "submitted", "created"].includes(
        providerStatus,
      )
    ) {
      return "processing";
    }

    return "processing";
  }

  async getAuthHeaders() {
    const config = this.getConfig();

    if (config.authMode === "api_key") {
      return {
        "Content-Type": "application/json",
        [config.apiKeyHeader]: `${config.apiKeyPrefix} ${config.apiKey}`.trim(),
      };
    }

    if (config.authMode !== "oauth_client_credentials") {
      return {
        error: this.getMissingConfigMessage(),
      };
    }

    const tokenPayload = {
      [config.tokenClientIdField]: config.clientId,
      [config.tokenClientSecretField]: config.clientSecret,
      [config.tokenGrantTypeField]: config.tokenGrantType,
    };

    const tokenResponse = await fetch(config.tokenUrl, {
      method: config.tokenMethod,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tokenPayload),
    });

    const tokenJson = await tokenResponse.json().catch(() => ({}));

    if (!tokenResponse.ok) {
      return {
        error:
          tokenJson?.message ||
          tokenJson?.error ||
          `TRIPO TOKEN REQUEST FAILED WITH STATUS ${tokenResponse.status}`,
      };
    }

    const accessToken = this.extractAccessToken(tokenJson);

    if (!accessToken) {
      return {
        error: "TRIPO ACCESS TOKEN NOT FOUND IN TOKEN RESPONSE",
      };
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
  }

  async createImageToModelTask(product) {
    const headers = await this.getAuthHeaders();

    if ("error" in headers) {
      return {
        status: "ERR",
        message: headers.error,
      };
    }

    if (!isHttpUrl(product.image)) {
      return {
        status: "ERR",
        message:
          "PRODUCT IMAGE MUST BE A PUBLIC HTTP/HTTPS URL. Tripo khong the doc anh tu duong dan local hoac duong dan tuong doi.",
      };
    }

    if (product.image.includes("localhost") || product.image.includes("127.0.0.1")) {
      return {
        status: "ERR",
        message:
          "PRODUCT IMAGE MUST BE PUBLIC. Tripo khong the truy cap anh dang tro toi localhost/127.0.0.1.",
      };
    }

    const candidatePayloads = this.buildCandidateCreatePayloads(product);
    let lastErrorMessage = "TRIPO REQUEST FAILED";

    for (const requestBody of candidatePayloads) {
      const response = await fetch(this.createTaskUrl(), {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const providerMessage =
          payload?.message ||
          payload?.error ||
          payload?.msg ||
          `TRIPO REQUEST FAILED WITH STATUS ${response.status}`;
        const rawPayload = JSON.stringify(payload);

        lastErrorMessage = `${providerMessage}${rawPayload && rawPayload !== "{}" ? ` | RAW: ${rawPayload}` : ""}`;
        continue;
      }

      const taskId = this.extractTaskId(payload);

      if (!taskId) {
        lastErrorMessage = "TRIPO TASK ID NOT FOUND IN RESPONSE";
        continue;
      }

      return {
        status: "OK",
        message: "TASK CREATED",
        data: {
          taskId,
          raw: payload,
          requestBody,
        },
      };
    }

    return {
      status: "ERR",
      message: lastErrorMessage,
    };
  }

  async getTaskStatus(taskId) {
    const headers = await this.getAuthHeaders();

    if ("error" in headers) {
      return {
        status: "ERR",
        message: headers.error,
      };
    }

    const response = await fetch(this.getTaskUrl(taskId), {
      method: "GET",
      headers,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        status: "ERR",
        message:
          payload?.message ||
          payload?.error ||
          `TRIPO STATUS REQUEST FAILED WITH STATUS ${response.status}`,
      };
    }

    const providerStatus = this.extractProviderStatus(payload);
    const localStatus = this.mapStatus(providerStatus);
    const modelUrl = this.extractModelUrl(payload);

    return {
      status: "OK",
      message: "SUCCESS",
      data: {
        providerStatus,
        localStatus,
        modelUrl,
        raw: payload,
      },
    };
  }
}

export default new Tripo3DService();
