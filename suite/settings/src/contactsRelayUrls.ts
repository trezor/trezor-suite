// Plain `ws://` is allowed only to this machine, so a local relay can be used for development.
const LOCAL_RELAY_HOSTNAMES = ['localhost', '127.0.0.1'];

/**
 * The most relays the contacts exchange uses. Every relay of a wallet replays its stored backlog,
 * and all of them together must stay below the contacts reducer's caps on remembered request ids.
 */
export const MAX_CONTACTS_RELAY_URLS = 4;

const parseUrl = (url: string) => {
    try {
        return new URL(url);
    } catch {
        return undefined;
    }
};

const parseValidContactsRelayUrl = (url: string) => {
    const parsedUrl = parseUrl(url);

    if (!parsedUrl) {
        return undefined;
    }

    if (parsedUrl.username !== '' || parsedUrl.password !== '') {
        return undefined;
    }

    // `search` and `hash` are empty for a bare `?` or `#`, the serialized URL is not.
    if (/[?#]/.test(parsedUrl.href)) {
        return undefined;
    }

    if (parsedUrl.protocol === 'wss:') {
        return parsedUrl;
    }

    const isLocalRelay =
        parsedUrl.protocol === 'ws:' && LOCAL_RELAY_HOSTNAMES.includes(parsedUrl.hostname);

    return isLocalRelay ? parsedUrl : undefined;
};

/** Whether both URLs name the same relay, e.g. with and without the trailing slash. */
export const isSameContactsRelayUrl = (url: string, otherUrl: string): boolean => {
    const href = parseUrl(url.trim())?.href;

    return href !== undefined && href === parseUrl(otherUrl.trim())?.href;
};

/**
 * Whether the contacts address exchange may use this relay. The exchange publishes addresses in
 * plain text, so a remote relay must be reached over TLS (`wss://`). Credentials, a query and a
 * fragment are rejected, because those are where URLs carry access tokens, and the relay list is
 * persisted and relay URLs end up in desktop logs.
 */
export const isValidContactsRelayUrl = (url: string): boolean =>
    parseValidContactsRelayUrl(url) !== undefined;

/**
 * The relay list as the settings store it: trimmed, valid, in the given order and at most
 * `MAX_CONTACTS_RELAY_URLS` long. Each entry opens its own connection, so spellings of one relay
 * (letter case, default port, trailing slash) keep only the first. Entries of any type are
 * accepted, because the list loaded from storage is checked here too.
 */
export const getValidContactsRelayUrls = (urls: readonly unknown[]): string[] => {
    const urlsByHref = new Map<string, string>();

    urls.forEach(url => {
        if (typeof url !== 'string') return;

        const trimmedUrl = url.trim();
        const parsedUrl = parseValidContactsRelayUrl(trimmedUrl);

        if (parsedUrl && !urlsByHref.has(parsedUrl.href)) {
            urlsByHref.set(parsedUrl.href, trimmedUrl);
        }
    });

    return [...urlsByHref.values()].slice(0, MAX_CONTACTS_RELAY_URLS);
};
