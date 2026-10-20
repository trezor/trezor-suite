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

/** Result for request targets that cannot be routed. */
const unparsable = (): ParsedRequestUrl => ({
    protocol: null,
    hostname: null,
    pathname: null,
    query: {},
    search: null,
    hash: null,
});

/**
 * Parse a request URL (typically a relative path like `/foo?a=1`) into its components.
 * Uses the WHATWG URL API for splitting the URL into pathname/search/hash, and
 * `querystring.parse` for query-string decoding (preserving the same semantics as
 * the legacy `url.parse(requestUrl, true)` — `+` is decoded as space, `%20` likewise).
 *
 * Returns a null `pathname` for request targets that node's http parser accepts but that
 * cannot be routed, such as `//[` or `//enumerate`, so the caller can reject the request.
 */
export const parseRequestUrl = (requestUrl: string): ParsedRequestUrl => {
    const isAbsolute = /^[a-z][a-z\d+\-.]*:\/\//i.test(requestUrl);

    // An origin-form request target cannot start with `//` (RFC 9112 3.2.1). Node's http parser
    // accepts such a target anyway, and `new URL()` then reads the `//` as an authority, so the
    // host would be dropped and the request routed to the remaining path instead.
    if (!isAbsolute && requestUrl.startsWith('//')) {
        return unparsable();
    }

    let parsed: URL;
    try {
        parsed = new URL(requestUrl, DUMMY_BASE);
    } catch {
        return unparsable();
    }

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
