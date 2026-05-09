export type CSRFTokenProvider = () => string | null | undefined;

export type OpenLearningToolsApiClientConfig = {
  baseUrl?: string;
  csrfToken?: CSRFTokenProvider;
  fetch?: typeof fetch;
};

let clientConfig: OpenLearningToolsApiClientConfig = {};

export function configureOpenLearningToolsApiClient(
  config: OpenLearningToolsApiClientConfig,
): void {
  clientConfig = { ...clientConfig, ...config };
}

function getBrowserCSRFToken(): string | null {
  if (typeof document === "undefined" || !document.cookie) {
    return null;
  }

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const trimmedCookie = cookie.trim();
    if (trimmedCookie.startsWith("csrftoken=")) {
      return decodeURIComponent(trimmedCookie.slice("csrftoken=".length));
    }
  }

  return null;
}

function buildUrl(url: string): string {
  if (!clientConfig.baseUrl || /^https?:\/\//.test(url)) {
    return url;
  }

  const baseUrl = clientConfig.baseUrl.replace(/\/$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${path}`;
}

export async function openLearningToolsFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const csrfToken = clientConfig.csrfToken?.() ?? getBrowserCSRFToken();

  if (!headers.has("Content-Type") && options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (csrfToken && !headers.has("X-CSRFToken")) {
    headers.set("X-CSRFToken", csrfToken);
  }

  const fetchImplementation = clientConfig.fetch ?? globalThis.fetch;
  const response = await fetchImplementation(buildUrl(url), {
    credentials: "include",
    ...options,
    headers,
  });

  const contentType = response.headers.get("Content-Type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : undefined;

  return {
    data,
    status: response.status,
    headers: response.headers,
  } as T;
}
