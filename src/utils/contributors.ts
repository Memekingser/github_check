import { Contributor } from '../types';

export function filterAndSortContributors(
  contributors: Contributor[],
  filter: 'all' | 'with_twitter' | 'without_twitter',
  sort: 'contributions' | 'login'
): Contributor[] {
  let list = [...contributors];

  if (filter === 'with_twitter') {
    list = list.filter((c) => c.has_twitter === true);
  } else if (filter === 'without_twitter') {
    list = list.filter((c) => c.has_twitter === false);
  }

  list.sort((a, b) => {
    if (sort === 'login') {
      return a.login.localeCompare(b.login);
    }
    return b.contributions - a.contributions;
  });

  return list;
}

export function computeTwitterStats(contributors: Contributor[]): {
  total: number;
  withTwitter: number;
} {
  const ready = contributors.filter((c) => c.has_twitter !== null);
  return {
    total: contributors.length,
    withTwitter: ready.filter((c) => c.has_twitter).length,
  };
}
