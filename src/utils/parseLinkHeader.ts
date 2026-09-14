/**
 * Parse GitHub (RFC 5988) Link header and return the "next" URL if present.
 */
export function parseNextLink(linkHeader: string | undefined): string | null {
  if (!linkHeader) {
    return null;
  }
  const parts = linkHeader.split(',');
  for (const part of parts) {
    const match = part.match(/<([^>]+)>;\s*rel="next"/);
    if (match) {
      return match[1];
    }
  }
  return null;
}
