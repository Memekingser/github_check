export interface Contributor {
  id: number;
  login: string;
  avatar_url: string;
  contributions: number;
  twitter_username: string | null;
  has_twitter: boolean | null;
  loading: boolean;
  error?: string;
}

export interface RepoInfo {
  owner: string;
  repo: string;
}

export interface RateLimitInfo {
  remaining: number | null;
  limit: number | null;
  reset: number | null;
}

export interface TwitterStats {
  total: number;
  withTwitter: number;
}

export type FilterMode = 'all' | 'with_twitter' | 'without_twitter';
export type SortMode = 'contributions' | 'login';

export interface FetchProgress {
  phase: 'idle' | 'contributors' | 'profiles' | 'done';
  loaded: number;
  total: number;
}
