import { parseHostname } from '@trezor/utils';
import { TOR_URLS } from '@trezor/urls';
import { TorStatus } from 'src/types/suite';

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

export const getIsTorDomain = (domain: string) => domain.endsWith('.onion');

export const isOnionUrl = (url: string) => {
    const hostname = parseHostname(url);
    return !!hostname && getIsTorDomain(hostname);
};

export const getIsTorEnabled = (torStatus: TorStatus) => {
    switch (torStatus) {
        case TorStatus.Enabled:
        case TorStatus.Misbehaving:
            // When Tor is in status Misbehaving means network is not behaving properly but still enabled.
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
