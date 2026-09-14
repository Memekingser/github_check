import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Contributor, RateLimitInfo } from '../types';
import { parseNextLink } from '../utils/parseLinkHeader';

const GITHUB_API_BASE_URL = 'https://api.github.com';
const DEFAULT_CONCURRENCY = 5;

export function createGithubApi(token?: string): AxiosInstance {
  return axios.create({
    baseURL: GITHUB_API_BASE_URL,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    timeout: 15000,
  });
}

export function parseRateLimit(headers: AxiosResponse['headers']): RateLimitInfo {
  const remaining = headers['x-ratelimit-remaining'];
  const limit = headers['x-ratelimit-limit'];
  const reset = headers['x-ratelimit-reset'];

  return {
    remaining: remaining != null ? Number(remaining) : null,
    limit: limit != null ? Number(limit) : null,
    reset: reset != null ? Number(reset) : null,
  };
}

export async function verifyRepo(
  api: AxiosInstance,
  owner: string,
  repo: string,
  signal?: AbortSignal
): Promise<RateLimitInfo> {
  const response = await api.get(`/repos/${owner}/${repo}`, { signal });
  return parseRateLimit(response.headers);
}

/**
 * Fetch all contributor pages (up to GitHub's practical limits).
 */
export async function fetchAllContributors(
  api: AxiosInstance,
  owner: string,
  repo: string,
  signal?: AbortSignal,
  onPage?: (count: number) => void
): Promise<{ contributors: Contributor[]; rateLimit: RateLimitInfo }> {
  const contributors: Contributor[] = [];
  let page = 1;
  let rateLimit: RateLimitInfo = { remaining: null, limit: null, reset: null };
  let nextUrl: string | null = null;

  do {
    const response = nextUrl
      ? await api.get(nextUrl, { signal })
      : await api.get(`/repos/${owner}/${repo}/contributors`, {
          params: { per_page: 100, anon: 0, page },
          signal,
        });

    rateLimit = parseRateLimit(response.headers);

    if (!Array.isArray(response.data)) {
      break;
    }

    for (const item of response.data) {
      if (!item?.login) {
        continue; // skip anonymous
      }
      contributors.push({
        id: item.id,
        login: item.login,
        avatar_url: item.avatar_url,
        contributions: item.contributions,
        twitter_username: null,
        has_twitter: null,
        loading: true,
      });
    }

    onPage?.(contributors.length);
    nextUrl = parseNextLink(response.headers.link as string | undefined);
    page += 1;
  } while (nextUrl && !signal?.aborted);

  return { contributors, rateLimit };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
  signal?: AbortSignal
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await worker(items[current], current);
    }
  });

  await Promise.all(runners);
  return results;
}

export type ProfileUpdate = {
  index: number;
  patch: Partial<Contributor>;
  rateLimit: RateLimitInfo;
};

/**
 * Enrich contributors with profile twitter_username using limited concurrency.
 */
export async function enrichContributorProfiles(
  api: AxiosInstance,
  contributors: Contributor[],
  options: {
    concurrency?: number;
    signal?: AbortSignal;
    onUpdate: (update: ProfileUpdate) => void;
  }
): Promise<RateLimitInfo> {
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  let latestRateLimit: RateLimitInfo = { remaining: null, limit: null, reset: null };

  await mapWithConcurrency(
    contributors,
    concurrency,
    async (contributor, index) => {
      try {
        const response = await api.get(`/users/${contributor.login}`, {
          signal: options.signal,
        });
        latestRateLimit = parseRateLimit(response.headers);
        const twitterUsername: string | null = response.data.twitter_username ?? null;

        options.onUpdate({
          index,
          rateLimit: latestRateLimit,
          patch: {
            twitter_username: twitterUsername,
            has_twitter: Boolean(twitterUsername),
            loading: false,
            error: undefined,
          },
        });
      } catch (error: any) {
        if (axios.isCancel(error) || error?.name === 'CanceledError' || error?.name === 'AbortError') {
          throw error;
        }

        const status = error?.response?.status;
        if (error?.response?.headers) {
          latestRateLimit = parseRateLimit(error.response.headers);
        }

        options.onUpdate({
          index,
          rateLimit: latestRateLimit,
          patch: {
            loading: false,
            has_twitter: null,
            error:
              status === 403
                ? '速率限制'
                : status === 404
                  ? '用户不存在'
                  : '资料加载失败',
          },
        });

        if (status === 403) {
          // Propagate so caller can stop / toast
          const rateError = new Error('RATE_LIMIT');
          (rateError as any).rateLimit = latestRateLimit;
          throw rateError;
        }
      }
    },
    options.signal
  );

  return latestRateLimit;
}

export function formatRateLimitReset(reset: number | null): string {
  if (!reset) {
    return '';
  }
  const date = new Date(reset * 1000);
  return date.toLocaleTimeString();
}
