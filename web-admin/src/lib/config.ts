const env = import.meta.env;

const envApi = ((env.VITE_API_BASE_URL as string | undefined) ?? "").toString().trim();
const defaultProtocol = typeof window !== "undefined" ? window.location.protocol : "http:";
const defaultHost = typeof window !== "undefined" ? window.location.hostname : "127.0.0.1";
const runtimeDefault = `${defaultProtocol}//${defaultHost}:8080`;

export const defaultApiBaseUrl = envApi || runtimeDefault;
export const defaultRequestTimeout = Number((env.VITE_API_TIMEOUT as any) ?? 15_000);


