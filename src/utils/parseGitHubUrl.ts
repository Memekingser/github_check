import { RepoInfo } from '../types';

/**
 * Parse common GitHub repository URL / shorthand forms into owner/repo.
 */
export function parseGitHubUrl(url: string): RepoInfo | null {
  try {
    let urlStr = url.trim().replace(/\/+$/, '');

    if (!urlStr) {
      return null;
    }

    // "github.com/user/repo" without protocol
    if (!urlStr.includes('://')) {
      if (urlStr.startsWith('github.com/')) {
        urlStr = 'https://' + urlStr;
      } else if (/^[\w.-]+\/[\w.-]+/.test(urlStr)) {
        // "user/repo" or "user/repo/..."
        const parts = urlStr.split('/').filter(Boolean);
        if (parts.length >= 2) {
          urlStr = `https://github.com/${parts[0]}/${parts[1]}`;
        }
      } else {
        return null;
      }
    }

    const urlObj = new URL(urlStr);

    if (urlObj.hostname !== 'github.com' && urlObj.hostname !== 'www.github.com') {
      return null;
    }

    const pathParts = urlObj.pathname.split('/').filter((part) => part.length > 0);

    if (pathParts.length < 2) {
      return null;
    }

    const owner = pathParts[0];
    const repo = pathParts[1].replace(/\.git$/, '');

    if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) {
      return null;
    }

    return { owner, repo };
  } catch {
    return null;
  }
}

export function toRepoShorthand(info: RepoInfo): string {
  return `${info.owner}/${info.repo}`;
}
