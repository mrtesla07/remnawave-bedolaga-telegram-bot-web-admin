const env = import.meta.env;

export const defaultApiBaseUrl = (env.VITE_API_BASE_URL as string | undefined) ?? "http://127.0.0.1:8080";
export const defaultRequestTimeout = Number(env.VITE_API_TIMEOUT ?? 15_000);


