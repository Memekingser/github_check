import { parseGitHubUrl, toRepoShorthand } from './parseGitHubUrl';

describe('parseGitHubUrl', () => {
  it('parses full https URLs', () => {
    expect(parseGitHubUrl('https://github.com/facebook/react')).toEqual({
      owner: 'facebook',
      repo: 'react',
    });
  });

  it('parses owner/repo shorthand', () => {
    expect(parseGitHubUrl('vercel/next.js')).toEqual({
      owner: 'vercel',
      repo: 'next.js',
    });
  });

  it('strips extra path segments and .git', () => {
    expect(parseGitHubUrl('https://github.com/facebook/react/tree/main/packages')).toEqual({
      owner: 'facebook',
      repo: 'react',
    });
    expect(parseGitHubUrl('https://github.com/facebook/react.git')).toEqual({
      owner: 'facebook',
      repo: 'react',
    });
  });

  it('accepts github.com without protocol', () => {
    expect(parseGitHubUrl('github.com/microsoft/vscode')).toEqual({
      owner: 'microsoft',
      repo: 'vscode',
    });
  });

  it('rejects non-github hosts and incomplete paths', () => {
    expect(parseGitHubUrl('https://gitlab.com/foo/bar')).toBeNull();
    expect(parseGitHubUrl('https://github.com/only-owner')).toBeNull();
    expect(parseGitHubUrl('')).toBeNull();
  });

  it('builds shorthand', () => {
    expect(toRepoShorthand({ owner: 'a', repo: 'b' })).toBe('a/b');
  });
});
