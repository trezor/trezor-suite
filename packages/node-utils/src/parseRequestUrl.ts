import querystring, { type ParsedUrlQuery } from 'querystring';

export interface ParsedRequestUrl {
    protocol: string | null;
    hostname: string | null;
    pathname: string | null;
    query: ParsedUrlQuery;
    search: string | null;
    hash: string | null;
}

/** Dummy base used to let the WHATWG URL constructor handle relative paths. */
const DUMMY_BASE = 'http://example.invalid';

/**
 * Parse a request URL (typically a relative path like `/foo?a=1`) into its components.
 * Uses the WHATWG URL API for splitting the URL into pathname/search/hash, and
 * `querystring.parse` for query-string decoding (preserving the same semantics as
 * the legacy `url.parse(requestUrl, true)` — `+` is decoded as space, `%20` likewise).
 */
export const parseRequestUrl = (requestUrl: string): ParsedRequestUrl => {
    const parsed = new URL(requestUrl, DUMMY_BASE);

    const isAbsolute = /^[a-z][a-z\d+\-.]*:\/\//i.test(requestUrl);

    const search = parsed.search || null;
    const query: ParsedUrlQuery = search ? querystring.parse(search.slice(1)) : {};

    return {
        protocol: isAbsolute ? parsed.protocol : null,
        hostname: isAbsolute ? parsed.hostname : null,
        pathname: parsed.pathname,
        query,
        search,
        hash: parsed.hash || null,
    };
};

/**
 * Format a parsed request URL back into a URL string.
 * Counterpart to `parseRequestUrl` — uses `querystring.stringify` for query
 * serialization (encodes spaces as `%20`, matching the legacy `url.format` behaviour).
 */
export const formatRequestUrl = ({
    protocol,
    hostname,
    pathname,
    query,
}: Pick<ParsedRequestUrl, 'protocol' | 'hostname' | 'pathname' | 'query'>): string => {
    const qs = querystring.stringify(query);
    const base =
        protocol && hostname ? `${protocol}//${hostname}${pathname || '/'}` : pathname || '/';

    return qs ? `${base}?${qs}` : base;
};
