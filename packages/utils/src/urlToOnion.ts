/**
 * Tries to replace clearnet domain name in given `url` by any of the onion domain names in
 * `onionDomains` map and return it. When no onion replacement is found, returns `undefined`.
 */
export const urlToOnion = (url: string, onionDomains: { [domain: string]: string }) => {
    const [, protocol, subdomain, domain, rest] =
        url.match(/^(http|ws)s?:\/\/([^:/]+\.)?([^/.]+\.[^/.]+)(\/.*)?$/i) ?? [];
    // ^(http|ws)s?:\/\/ - required http(s)/ws(s) protocol
    // ([^:/]+\.)? - optional subdomains, e.g. 'blog.'
    // ([^/.]+\.[^/.]+) - required two-part domain name, e.g. 'trezor.io'
    // (\/.*)?$ - optional path and/or query, e.g. '/api/data?id=1234'

    if (!domain || !onionDomains[domain]) return;

    return `${protocol}://${subdomain ?? ''}${onionDomains[domain]}${rest ?? ''}`;
};
