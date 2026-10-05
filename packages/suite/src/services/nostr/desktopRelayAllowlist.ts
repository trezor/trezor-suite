import { desktopApi } from '@trezor/suite-desktop-api';
import { isNotUndefined } from '@trezor/utils';

const getHostname = (url: string) => {
    try {
        return new URL(url).hostname;
    } catch {
        return undefined;
    }
};

/**
 * Admits the relay hosts in the desktop request filter, which cancels renderer requests to hosts
 * outside its allowlist. User-configured relays cannot be on its static list. Pass the full relay
 * list, it replaces the previous one. Await it before opening relay sockets, otherwise the first
 * connection attempt is cancelled and the blocked hostname is reported to Sentry. No-op on web.
 */
export const syncDesktopRelayAllowlist = (urls: readonly string[]): Promise<void> => {
    if (!desktopApi.available) return Promise.resolve();

    const hostnames = [...new Set(urls.map(getHostname).filter(isNotUndefined))];

    // A failed sync only leaves the relays blocked, which their connection status already shows.
    return desktopApi.setContactsRelayAllowedHosts(hostnames).catch(() => {});
};
