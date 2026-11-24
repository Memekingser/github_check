import { Contributor } from '../types';
import { computeTwitterStats, filterAndSortContributors } from './contributors';

const sample: Contributor[] = [
  {
    id: 1,
    login: 'zebra',
    avatar_url: '',
    contributions: 3,
    twitter_username: 'z',
    has_twitter: true,
    loading: false,
  },
  {
    id: 2,
    login: 'alpha',
    avatar_url: '',
    contributions: 10,
    twitter_username: null,
    has_twitter: false,
    loading: false,
  },
  {
    id: 3,
    login: 'mid',
    avatar_url: '',
    contributions: 5,
    twitter_username: null,
    has_twitter: null,
    loading: true,
  },
];

describe('filterAndSortContributors', () => {
  it('filters with/without twitter', () => {
    expect(filterAndSortContributors(sample, 'with_twitter', 'login').map((c) => c.login)).toEqual([
      'zebra',
    ]);
    expect(
      filterAndSortContributors(sample, 'without_twitter', 'login').map((c) => c.login)
    ).toEqual(['alpha']);
  });

  it('sorts by contributions descending', () => {
    expect(filterAndSortContributors(sample, 'all', 'contributions').map((c) => c.login)).toEqual([
      'alpha',
      'mid',
      'zebra',
    ]);
  });
});

describe('computeTwitterStats', () => {
  it('counts totals and twitter presence', () => {
    expect(computeTwitterStats(sample)).toEqual({ total: 3, withTwitter: 1 });
  });
});
