// origin: https://github.com/trezor/connect/blob/develop/src/js/utils/urlUtils.js

export const getOrigin = (url: unknown) => {
    if (typeof url !== 'string') return 'unknown';
    if (url.indexOf('file://') === 0) return 'file://';
    const [origin] = url.match(/^https?:\/\/[^/]+/) ?? [];
    return origin ?? 'unknown';
};

export const getHost = (url: unknown) => {
    if (typeof url !== 'string') return;
    const [, , uri] = url.match(/^(https?):\/\/([^:/]+)?/i) ?? [];
    if (uri) {
        const parts = uri.split('.');
        return parts.length > 2
            ? // slice subdomain
              parts.slice(parts.length - 2, parts.length).join('.')
            : uri;
    }
};

export const getOnionDomain = <T extends string | string[]>(
    url: T,
    dict: { [domain: string]: string },
): T => {
    if (Array.isArray(url)) {
        return url.map(u => getOnionDomain(u, dict)) as T;
    }
    if (typeof url === 'string') {
        const [, protocol, subdomain, domain, rest] =
            url.match(/^(http|ws)s?:\/\/([^:/]+\.)?([^/.]+\.[^/.]+)(\/.*)?$/i) ?? [];
        // ^(http|ws)s?:\/\/ - required http(s)/ws(s) protocol
        // ([^:/]+\.)? - optional subdomains, e.g. 'blog.'
        // ([^/.]+\.[^/.]+) - required two-part domain name, e.g. 'trezor.io'
        // (\/.*)?$ - optional path and/or query, e.g. '/api/data?id=1234'

        if (!domain || !dict[domain]) return url;

        return `${protocol}://${subdomain || ''}${dict[domain]}${rest || ''}` as T;
    }
    return url;
};
