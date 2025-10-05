import axios from "axios";
import type { AxiosError } from "axios";

import { defaultRequestTimeout } from "@/lib/config";
import { normalizeBaseUrl } from "@/lib/api-client";

export type ApiTokenValidationErrorReason =
  | "invalid"
  | "forbidden"
  | "timeout"
  | "network"
  | "unknown";

export class ApiTokenValidationError extends Error {
  public readonly reason: ApiTokenValidationErrorReason;

  constructor(message: string, reason: ApiTokenValidationErrorReason, options?: ErrorOptions) {
    super(message, options);
    this.name = "ApiTokenValidationError";
    this.reason = reason;
  }
}

interface ValidateApiTokenOptions {
  baseUrl: string | undefined;
  token: string;
  timeoutMs?: number;
}

function mapAxiosError(error: AxiosError): ApiTokenValidationError {
  const response = error.response;
  if (response) {
    const status = response.status;
    if (status === 401) {
      return new ApiTokenValidationError(
        "Неверный или истекший API ключ",
        "invalid",
        { cause: error },
      );
    }
    if (status === 403) {
      return new ApiTokenValidationError(
        "Доступ к Web API запрещён для этого ключа",
        "forbidden",
        { cause: error },
      );
    }
    return new ApiTokenValidationError(
      "API вернул ошибку " + status,
      "unknown",
      { cause: error },
    );
  }

  if (error.code === "ECONNABORTED") {
    return new ApiTokenValidationError(
      "Превышено время ожидания ответа от Web API",
      "timeout",
      { cause: error },
    );
  }

  return new ApiTokenValidationError(
    "Не удалось подключиться к Web API",
    "network",
    { cause: error },
  );
}

export async function validateApiToken({
  baseUrl,
  token,
  timeoutMs,
}: ValidateApiTokenOptions): Promise<void> {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  if (!normalizedBaseUrl) {
    throw new ApiTokenValidationError("Укажите URL Web API", "invalid");
  }
  const trimmedToken = token.trim();
  if (!trimmedToken) {
    throw new ApiTokenValidationError("Заполните API ключ", "invalid");
  }

  const client = axios.create({
    baseURL: normalizedBaseUrl,
    timeout: timeoutMs ?? defaultRequestTimeout,
    headers: {
      "X-API-Key": trimmedToken,
      "X-Requested-With": "BedolagaAdminUI",
    },
    validateStatus: (status) => status >= 200 && status < 300,
  });

  try {
    await client.get("/health", { params: { _: Date.now() } });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw mapAxiosError(error);
    }
    throw new ApiTokenValidationError(
      "Не удалось проверить Web API",
      "unknown",
      { cause: error as Error },
    );
  }
}
