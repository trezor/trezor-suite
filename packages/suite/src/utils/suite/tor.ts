import { parseHostname } from '@trezor/utils';
import { TOR_URLS } from '@trezor/urls';
import { TorStatus } from '@suite-types';

/**
 * returns tor url if tor url is request and tor url is available for given domain
 */
export const getTorUrlIfAvailable = (url: string) => {
    const [, subdomain, domain, rest] =
        url.match(/^https?:\/\/([^:/]+\.)?([^/.]+\.[^/.]+)(\/.*)?$/i) ?? [];
    // ^https?:\/\/ - required http(s) protocol
    // ([^:/]+\.)? - optional subdomains, e.g. 'blog.'
    // ([^/.]+\.[^/.]+) - required two-part domain name, e.g. 'trezor.io'
    // (\/.*)?$ - optional path and/or query, e.g. '/api/data?id=1234'

    if (!domain) return;

    // TOR_URL contains a map of open:onion domains
    const onionDomain = TOR_URLS[domain];
    if (!onionDomain) return;

    return `http://${subdomain ?? ''}${onionDomain}${rest ?? ''}`;
};

export const toTorUrl = (url: string) => {
    const torUrl = getTorUrlIfAvailable(url);
    if (!torUrl) {
        console.warn(`tor url is not available for ${url}`);
        return url;
    }
    return torUrl;
};

export const getIsTorDomain = (domain: string) => domain.endsWith('.onion');

export const isOnionUrl = (url: string) => {
    const hostname = parseHostname(url);
    return !!hostname && getIsTorDomain(hostname);
};

export const baseFetch = window.fetch;

export const torFetch = (input: RequestInfo | URL, init?: RequestInit | undefined) => {
    if (typeof input === 'string') {
        input = toTorUrl(input);
    }

    return baseFetch(input, init);
};

export const getIsTorEnabled = (torStatus: TorStatus) => {
    switch (torStatus) {
        case TorStatus.Enabled:
            return true;

        case TorStatus.Enabling:
        case TorStatus.Disabling:
        case TorStatus.Disabled:
            return false;

        default:
            return false;
    }
};

export const getIsTorLoading = (torStatus: TorStatus) => {
    switch (torStatus) {
        case TorStatus.Enabling:
        case TorStatus.Disabling:
            return true;

        case TorStatus.Enabled:
        case TorStatus.Disabled:
            return false;

        default:
            return false;
    }
};
