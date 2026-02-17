import * as url from 'url';

/**
 * Parsed URL object matching the structure returned by url.parse()
 */
export interface ParsedUrl {
    pathname: string;
    search?: string;
    query: Record<string, string | string[]>;
}

/**
 * Parse URL string and return pathname, search, and query parameters.
 * Currently uses Node.js url.parse() internally, but abstracted for future migration to WHATWG URL API.
 *
 * @param urlString - The URL string to parse (relative or absolute)
 * @returns Object with pathname, search, and query properties
 */
export const parseUrl = (urlString: string): ParsedUrl => {
    const parsed = url.parse(urlString, true);

    // Filter out undefined values from query object
    const query: Record<string, string | string[]> = {};
    if (parsed.query) {
        for (const [key, value] of Object.entries(parsed.query)) {
            if (value !== undefined) {
                query[key] = value;
            }
        }
    }

    return {
        pathname: parsed.pathname || '',
        search: parsed.search || undefined,
        query,
    };
};
