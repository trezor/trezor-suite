import { TOR_URLS } from '@suite-constants/tor';

/**
 * returns tor url if tor url is request and tor url is available for given domain
 */
export const getTorUrlIfAvailable = (url: string) => {
    const { host, pathname } = new URL(url);

    // blog.trezor.io => [a = io], [b= trezor], [sub=blog]
    const [a, b, ...sub] = host.split('.').reverse();
    const domain = `${b}.${a}`;

    // TOR_URL contains a map of open:onion domains
    const torCounterpartDomain = TOR_URLS[domain];

    if (!torCounterpartDomain) {
        return;
    }
    return `http://${sub.length ? `${sub.join('.')}.` : ''}${torCounterpartDomain}${pathname}`;
};

export const toTorUrl = (url: string) => {
    const torUrl = getTorUrlIfAvailable(url);
    if (!torUrl) {
        throw new Error(`tor url is not available for ${url}`);
    }
    return torUrl;
};

export const isTorDomain = (domain: string) => domain.endsWith('.onion');
