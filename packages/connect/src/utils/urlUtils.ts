// origin: https://github.com/trezor/connect/blob/develop/src/js/utils/urlUtils.js

import { urlToOnion } from '@trezor/utils';

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

interface GetOnionDomain {
    (url: string, dict: { [domain: string]: string }): string;
    (url: string[], dict: { [domain: string]: string }): string[];
}

export const getOnionDomain: GetOnionDomain = (url, dict): any => {
    if (Array.isArray(url)) return url.map(u => urlToOnion(u, dict) ?? u);
    if (typeof url === 'string') return urlToOnion(url, dict) ?? url;

    return url;
};
