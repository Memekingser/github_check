import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

import {
  createGithubApi,
  enrichContributorProfiles,
  fetchAllContributors,
  formatRateLimitReset,
  verifyRepo,
} from './api/github';
import { ContributorItem } from './components/ContributorItem';
import {
  AdvancedToggle,
  AppContainer,
  Button,
  ContributorsList,
  Input,
  InputForm,
  LoadingSpinner,
  MetaRow,
  Panel,
  ProgressBarFill,
  ProgressBarTrack,
  Select,
  StatItem,
  StatsGrid,
  Subtitle,
  Title,
  TokenBox,
  Toolbar,
} from './styles';
import {
  Contributor,
  FetchProgress,
  FilterMode,
  RateLimitInfo,
  SortMode,
} from './types';
import { computeTwitterStats, filterAndSortContributors } from './utils/contributors';
import { exportContributorsCsv } from './utils/exportCsv';
import { parseGitHubUrl, toRepoShorthand } from './utils/parseGitHubUrl';

const TOKEN_STORAGE_KEY = 'gctc_github_token';

function readInitialRepoFromUrl(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('repo') ?? '';
  } catch {
    return '';
  }
}

function readStoredToken(): string {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function App() {
  const [repoUrl, setRepoUrl] = useState(readInitialRepoFromUrl);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [githubToken, setGithubToken] = useState(readStoredToken);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sort, setSort] = useState<SortMode>('contributions');
  const [rateLimit, setRateLimit] = useState<RateLimitInfo>({
    remaining: null,
    limit: null,
    reset: null,
  });
  const [progress, setProgress] = useState<FetchProgress>({
    phase: 'idle',
    loaded: 0,
    total: 0,
  });
  const [activeRepo, setActiveRepo] = useState('');

  const abortRef = useRef<AbortController | null>(null);
  const autoStarted = useRef(false);

  const stats = useMemo(() => computeTwitterStats(contributors), [contributors]);
  const visible = useMemo(
    () => filterAndSortContributors(contributors, filter, sort),
    [contributors, filter, sort]
  );

  const progressPct =
    progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : 0;

  const cancelOngoing = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const runCheck = useCallback(
    async (rawUrl: string) => {
      cancelOngoing();

      const repoInfo = parseGitHubUrl(rawUrl);
      if (!repoInfo) {
        toast.error('请输入有效的 GitHub 仓库链接，例如: https://github.com/facebook/react');
        return;
      }

      const shorthand = toRepoShorthand(repoInfo);
      setActiveRepo(shorthand);
      setContributors([]);
      setFilter('all');
      setProgress({ phase: 'contributors', loaded: 0, total: 0 });
      setLoading(true);

      const params = new URLSearchParams(window.location.search);
      params.set('repo', shorthand);
      window.history.replaceState(null, '', `?${params.toString()}`);

      const controller = new AbortController();
      abortRef.current = controller;
      const api = createGithubApi(githubToken || undefined);

      try {
        const repoRate = await verifyRepo(api, repoInfo.owner, repoInfo.repo, controller.signal);
        setRateLimit(repoRate);

        const { contributors: list, rateLimit: listRate } = await fetchAllContributors(
          api,
          repoInfo.owner,
          repoInfo.repo,
          controller.signal,
          (count) => setProgress({ phase: 'contributors', loaded: count, total: count })
        );
        setRateLimit(listRate);

        if (list.length === 0) {
          toast.info('该仓库没有贡献者数据。');
          setProgress({ phase: 'done', loaded: 0, total: 0 });
          return;
        }

        setContributors(list);
        setProgress({ phase: 'profiles', loaded: 0, total: list.length });

        let completed = 0;
        const markRemaining = (errorLabel: string) => {
          setContributors((prev) =>
            prev.map((c) =>
              c.loading
                ? {
                    ...c,
                    loading: false,
                    error: errorLabel,
                  }
                : c
            )
          );
        };

        try {
          const finalRate = await enrichContributorProfiles(api, list, {
            concurrency: 5,
            signal: controller.signal,
            onUpdate: ({ index, patch, rateLimit: rl }) => {
              setRateLimit(rl);
              setContributors((prev) => {
                if (!prev[index]) {
                  return prev;
                }
                const next = [...prev];
                next[index] = { ...next[index], ...patch };
                return next;
              });
              completed += 1;
              setProgress({ phase: 'profiles', loaded: completed, total: list.length });
            },
          });
          setRateLimit(finalRate);
        } catch (profileError: any) {
          if (profileError?.message === 'RATE_LIMIT') {
            toast.error('GitHub API 速率限制已达到。请添加 Token 或稍后再试。');
            if (profileError.rateLimit) {
              setRateLimit(profileError.rateLimit);
            }
            markRemaining('速率限制');
          } else if (
            axios.isCancel(profileError) ||
            profileError?.name === 'CanceledError' ||
            profileError?.name === 'AbortError'
          ) {
            markRemaining('已取消');
            throw profileError;
          } else {
            markRemaining('资料加载失败');
            throw profileError;
          }
        }

        setProgress((p) => ({ ...p, phase: 'done', loaded: list.length }));
      } catch (error: any) {
        if (
          axios.isCancel(error) ||
          error?.name === 'CanceledError' ||
          error?.name === 'AbortError' ||
          error?.code === 'ERR_CANCELED'
        ) {
          toast.info('已取消请求。');
          return;
        }

        if (error.response) {
          if (error.response.status === 404) {
            toast.error('找不到该仓库，请检查链接是否正确。');
          } else if (error.response.status === 403) {
            toast.error('API 请求频率受限，请添加 Token 或稍后再试。');
          } else {
            toast.error(`GitHub API 错误: ${error.response.status}`);
          }
          if (error.response.headers) {
            setRateLimit({
              remaining:
                error.response.headers['x-ratelimit-remaining'] != null
                  ? Number(error.response.headers['x-ratelimit-remaining'])
                  : null,
              limit:
                error.response.headers['x-ratelimit-limit'] != null
                  ? Number(error.response.headers['x-ratelimit-limit'])
                  : null,
              reset:
                error.response.headers['x-ratelimit-reset'] != null
                  ? Number(error.response.headers['x-ratelimit-reset'])
                  : null,
            });
          }
        } else if (error.request) {
          toast.error('网络请求失败，请检查网络连接。');
        } else {
          toast.error('获取贡献者数据时出现错误。');
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        setLoading(false);
      }
    },
    [cancelOngoing, githubToken]
  );

  useEffect(() => {
    if (autoStarted.current) {
      return;
    }
    const initial = readInitialRepoFromUrl();
    if (initial && parseGitHubUrl(initial)) {
      autoStarted.current = true;
      void runCheck(initial);
    }
  }, [runCheck]);

  useEffect(() => {
    return () => cancelOngoing();
  }, [cancelOngoing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runCheck(repoUrl);
  };

  const handleTokenChange = (value: string) => {
    setGithubToken(value);
    try {
      if (value) {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, value);
      } else {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  };

  const handleExport = () => {
    if (visible.length === 0) {
      toast.info('没有可导出的数据。');
      return;
    }
    const name = activeRepo ? activeRepo.replace('/', '_') : 'contributors';
    exportContributorsCsv(visible, `${name}_twitter.csv`);
  };

  return (
    <AppContainer>
      <Title>GitHub 贡献者 Twitter / X 检测</Title>
      <Subtitle>
        输入仓库链接，批量查看贡献者是否在 GitHub 资料中填写了 Twitter / X 用户名。
      </Subtitle>

      <Panel>
        <p style={{ margin: '0 0 0.5rem' }}>
          支持完整 URL 或 <code>owner/repo</code> 简写。已移除不可靠的浏览器端 Twitter
          存活探测，改为直接展示 GitHub 资料中的用户名。
        </p>
        <AdvancedToggle type="button" onClick={() => setShowTokenInput((v) => !v)}>
          {showTokenInput ? '隐藏高级设置' : '显示高级设置'} ▾
        </AdvancedToggle>
        {showTokenInput && (
          <TokenBox>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#57606a' }}>
              未认证每小时约 60 次请求；添加 Token 可提升额度。Token 仅保存在本页
              sessionStorage。
            </p>
            <a
              href="https://github.com/settings/tokens/new?scopes=public_repo&description=contributors-twitter-checker"
              target="_blank"
              rel="noopener noreferrer"
            >
              创建 GitHub Token
            </a>
            <Input
              type="password"
              autoComplete="off"
              placeholder="输入 GitHub Personal Access Token（可选）"
              value={githubToken}
              onChange={(e) => handleTokenChange(e.target.value)}
            />
          </TokenBox>
        )}
      </Panel>

      <InputForm onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="例如: https://github.com/facebook/react 或 facebook/react"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? '检查中...' : '检查'}
        </Button>
        {loading && (
          <Button type="button" $variant="danger" onClick={cancelOngoing}>
            取消
          </Button>
        )}
      </InputForm>

      <MetaRow>
        <span>
          {activeRepo ? (
            <>
              当前仓库: <strong>{activeRepo}</strong>
            </>
          ) : (
            '尚未检查仓库'
          )}
        </span>
        <span>
          API 剩余额度:{' '}
          {rateLimit.remaining != null && rateLimit.limit != null
            ? `${rateLimit.remaining} / ${rateLimit.limit}`
            : '—'}
          {rateLimit.reset != null && rateLimit.remaining != null && rateLimit.remaining < 20
            ? `（重置于 ${formatRateLimitReset(rateLimit.reset)}）`
            : ''}
        </span>
      </MetaRow>

      {loading && (
        <Panel>
          <div>
            {progress.phase === 'contributors' &&
              `正在拉取贡献者列表… 已获取 ${progress.loaded} 人`}
            {progress.phase === 'profiles' &&
              `正在读取个人资料… ${progress.loaded} / ${progress.total}`}
            {progress.phase === 'done' && '完成'}
            {progress.phase === 'idle' && '准备中…'}
          </div>
          {progress.phase === 'profiles' && (
            <ProgressBarTrack>
              <ProgressBarFill $pct={progressPct} />
            </ProgressBarTrack>
          )}
          <LoadingSpinner />
        </Panel>
      )}

      {contributors.length > 0 && (
        <>
          <Panel>
            <StatsGrid>
              <StatItem>
                <strong>{stats.total}</strong>
                <span>贡献者</span>
              </StatItem>
              <StatItem>
                <strong>{stats.withTwitter}</strong>
                <span>有 Twitter / X</span>
              </StatItem>
              <StatItem>
                <strong>
                  {stats.total ? Math.round((stats.withTwitter / stats.total) * 100) : 0}%
                </strong>
                <span>占比</span>
              </StatItem>
              <StatItem>
                <strong>{visible.length}</strong>
                <span>当前筛选结果</span>
              </StatItem>
            </StatsGrid>
          </Panel>

          <Toolbar>
            <label>
              筛选{' '}
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterMode)}
              >
                <option value="all">全部</option>
                <option value="with_twitter">有 Twitter / X</option>
                <option value="without_twitter">无 Twitter / X</option>
              </Select>
            </label>
            <label>
              排序{' '}
              <Select value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
                <option value="contributions">贡献数</option>
                <option value="login">用户名</option>
              </Select>
            </label>
            <Button type="button" $variant="secondary" onClick={handleExport}>
              导出 CSV
            </Button>
          </Toolbar>
        </>
      )}

      <ContributorsList>
        {visible.map((contributor) => (
          <ContributorItem key={contributor.id} contributor={contributor} />
        ))}
      </ContributorsList>

      <ToastContainer position="bottom-right" />
    </AppContainer>
  );
}

export default App;
