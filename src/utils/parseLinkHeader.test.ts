import { parseNextLink } from '../utils/parseLinkHeader';

describe('parseNextLink', () => {
  it('extracts the next URL from a Link header', () => {
    const header =
      '<https://api.github.com/resource?page=2>; rel="next", <https://api.github.com/resource?page=5>; rel="last"';
    expect(parseNextLink(header)).toBe('https://api.github.com/resource?page=2');
  });

  it('returns null when there is no next link', () => {
    expect(parseNextLink('<https://api.github.com/resource?page=1>; rel="prev"')).toBeNull();
    expect(parseNextLink(undefined)).toBeNull();
  });
});
