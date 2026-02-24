// origin: https://github.com/trezor/connect/blob/develop/src/js/utils/urlUtils.js

export const getOrigin = (url: unknown) => {
    if (typeof url !== 'string') return 'unknown';
    if (url.startsWith('file://')) return 'file://';
    const [origin] = url.match(/^https?:\/\/[^/]+/) ?? [];

    return origin ?? 'unknown';
};

export const getHost = (url: unknown) => {
    if (typeof url !== 'string') return;
    const [, , uri] = url.match(/^(https?):\/\/([^:/]+)?/i) ?? [];
    if (uri) {
        const parts = uri.split('.');

        // allow localhost subdomains
        if (parts[parts.length - 1] === 'localhost') return 'localhost';

        return parts.length > 2
            ? // slice subdomain
              parts.slice(parts.length - 2, parts.length).join('.')
            : uri;
    }
};
