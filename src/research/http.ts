export const USER_AGENT = "LaunchJury/0.1 (launch research CLI; +https://github.com)";

export type Fetcher = typeof fetch;

export async function fetchJson<T = unknown>(
  url: string,
  opts: { fetchImpl?: Fetcher; retries?: number; timeoutMs?: number } = {},
): Promise<T> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const retries = opts.retries ?? 2;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 12_000);
    try {
      const res = await fetchImpl(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: ctrl.signal,
      });
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`HTTP ${res.status}`);
      }
      if (!res.ok) throw new NonRetryableError(`HTTP ${res.status} for ${url}`);
      return (await res.json()) as T;
    } catch (err) {
      lastErr = err;
      if (err instanceof NonRetryableError) throw err;
      if (attempt < retries) await sleep(600 * 2 ** attempt);
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export class NonRetryableError extends Error {}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function truncate(s: string, n: number): string {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length <= n ? clean : clean.slice(0, n - 1) + "…";
}

export function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/g, "/");
}
