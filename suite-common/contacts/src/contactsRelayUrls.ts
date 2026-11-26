/**
 * Public relays that took and stored both kinds of the exchange (7924 and 10777) when probed on
 * 2026-11-26. Suite desktop admits their hosts in its request filter; another relay works there
 * only on this machine (`ws://127.0.0.1`, `ws://localhost`).
 */
export const DEFAULT_CONTACTS_RELAY_URLS = [
    'wss://relay.primal.net',
    'wss://offchain.pub',
    'wss://relay.snort.social',
];

// Every relay gets its own socket and sees the wallet's hot key; three are enough to get through.
export const MAX_CONTACTS_RELAY_URLS = 3;

// Plain `ws://` only to this machine, for a local test relay.
const LOCAL_RELAY_HOSTNAMES = ['localhost', '127.0.0.1'];

const parseContactsRelayUrl = (url: string) => {
    let parsedUrl: URL;

    try {
        parsedUrl = new URL(url.trim());
    } catch {
        return undefined;
    }

    // URLs carry access tokens in these places, and relay URLs end up in logs.
    if (parsedUrl.username !== '' || parsedUrl.password !== '' || /[?#]/.test(parsedUrl.href)) {
        return undefined;
    }

    const isLocalRelay =
        parsedUrl.protocol === 'ws:' && LOCAL_RELAY_HOSTNAMES.includes(parsedUrl.hostname);

    return parsedUrl.protocol === 'wss:' || isLocalRelay ? parsedUrl : undefined;
};

export const isValidContactsRelayUrl = (url: string) => parseContactsRelayUrl(url) !== undefined;

/**
 * The relays the inbox uses: the valid ones of `urls`, each once and in order, at most
 * `MAX_CONTACTS_RELAY_URLS`; the default relays when none is valid.
 */
export const getContactsRelayUrls = (urls: readonly string[] | undefined) => {
    const urlsByHref = new Map<string, string>();

    urls?.forEach(url => {
        const parsedUrl = parseContactsRelayUrl(url);

        if (parsedUrl && !urlsByHref.has(parsedUrl.href)) {
            urlsByHref.set(parsedUrl.href, url.trim());
        }
    });

    const validUrls = [...urlsByHref.values()].slice(0, MAX_CONTACTS_RELAY_URLS);

    return validUrls.length > 0 ? validUrls : DEFAULT_CONTACTS_RELAY_URLS;
};
