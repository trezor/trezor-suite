export const getOrigin = (url: string) => {
    if (typeof url !== 'string') return 'unknown';
    if (url.indexOf('file://') === 0) return 'file://';
    // eslint-disable-next-line no-useless-escape
    const parts = url.match(/^.+\:\/\/[^\/]+/);
    return Array.isArray(parts) && parts.length > 0 ? parts[0] : 'unknown';
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
