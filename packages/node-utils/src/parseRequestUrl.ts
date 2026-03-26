import type { ParsedUrlQuery } from 'querystring';
import * as url from 'url';

export interface ParsedRequestUrl {
    protocol: string | null;
    hostname: string | null;
    pathname: string | null;
    query: ParsedUrlQuery;
    search: string | null;
    hash: string | null;
}

/**
 * Parse a request URL (typically a relative path like `/foo?a=1`) into its components.
 * Returns the same shape as `url.parse(requestUrl, true)` for the fields that are
 * consumed by HttpServer and http-receiver handlers.
 */
export const parseRequestUrl = (requestUrl: string): ParsedRequestUrl => {
    const { protocol, hostname, pathname, query, search, hash } = url.parse(requestUrl, true);

    return { protocol, hostname, pathname, query, search, hash };
};

/**
 * Format a parsed request URL back into a URL string.
 * Counterpart to `parseRequestUrl` — replaces `url.format({ protocol, hostname, pathname, query })`.
 */
export const formatRequestUrl = ({
    protocol,
    hostname,
    pathname,
    query,
}: Pick<ParsedRequestUrl, 'protocol' | 'hostname' | 'pathname' | 'query'>): string =>
    url.format({ protocol, hostname, pathname, query });
