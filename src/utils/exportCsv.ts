import { Contributor } from '../types';

export function exportContributorsCsv(contributors: Contributor[], filename: string): void {
  const header = ['login', 'contributions', 'twitter_username', 'github_url', 'twitter_url'];
  const rows = contributors.map((c) => [
    c.login,
    String(c.contributions),
    c.twitter_username ?? '',
    `https://github.com/${c.login}`,
    c.twitter_username ? `https://x.com/${c.twitter_username}` : '',
  ]);

  const escape = (value: string) => {
    if (/[",\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csv = [header, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
