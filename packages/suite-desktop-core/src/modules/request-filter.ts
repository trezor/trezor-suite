/**
 * Request Filter feature (blocks non-allowed requests)
 */
import { captureMessage } from '@sentry/electron/main';

import { validateIpcMessage } from '@trezor/ipc-proxy';
import { isWhitelistedHost } from '@trezor/utils';

import { allowedDomains, silentlyBlockedDomains } from '../config';
import { ipcMain } from '../typed-electron';
import type { ModuleInit } from './module';

export const SERVICE_NAME = 'request-filter';

// The renderer caps its relay list well below this; the limit only bounds a misbehaving caller.
const MAX_CONTACTS_RELAY_HOSTS = 32;

// Only a bare hostname survives the round trip, so a port, path or userinfo cannot be admitted.
const isBareHostname = (host: unknown): host is string => {
    if (typeof host !== 'string' || host === '') return false;

    try {
        return new URL(`wss://${host}`).hostname === host;
    } catch {
        return false;
    }
};

/**
 * This module handles request interception for the Electron Renderer thread. Requests are happening
 * in the Chromium browser (the Electron binary itself), so we have to relay on the api we get from Electron
 * (it falls down to `session.defaultSession.webRequest.onBeforeRequest`).
 *
 * The actual interception is done in `createElectronSessionInterceptor`, injected when loading modules.
 */
export const init: ModuleInit = ({ interceptor }) => {
    const { logger } = global;

    // Hosts of the nostr relays the user configured for contacts. Suite ships no default relay, so
    // none of them can be in the static `allowedDomains`. The renderer replaces the whole set
    // whenever its relay list changes. These match exactly, not as a domain suffix, so a configured
    // relay never admits other hosts of its domain. Exact matching does not contain a compromised
    // renderer, which can name its own host; admitting only websocket handshakes narrows what such
    // a host can be used for.
    const contactsRelayAllowedHosts = new Set<string>();
    // Relay hostnames are user-chosen and can identify the user. A socket to a removed relay can
    // still retry after the set shrinks, and that block must not report the hostname to Sentry.
    // Never shrinks, so the guarantee does not depend on the order of the renderer's calls.
    const everAdmittedContactsRelayHosts = new Set<string>();

    interceptor.onBeforeRequest(details => {
        const { hostname } = new URL(details.url);

        const isAdmittedContactsRelay =
            details.resourceType === 'webSocket' && contactsRelayAllowedHosts.has(hostname);

        if (isWhitelistedHost(hostname, allowedDomains) || isAdmittedContactsRelay) {
            logger.info(
                SERVICE_NAME,
                `${details.url} was allowed because ${hostname} is in the exception list`,
            );

            return;
        }

        if (everAdmittedContactsRelayHosts.has(hostname)) {
            return { cancel: true };
        }

        if (!isWhitelistedHost(hostname, silentlyBlockedDomains)) {
            logger.warn(
                SERVICE_NAME,
                `${details.url} was blocked because ${hostname} is not in the exception list`,
            );
            captureMessage(`request-filter: ${hostname}`, 'warning');
        }

        return { cancel: true };
    });

    // Registered after the filter is attached: if registering throws, the module init fails but the
    // filter still blocks, instead of every request passing unfiltered.
    ipcMain.handle('contacts-relays/set-allowed-hosts', (ipcEvent, hosts: unknown) => {
        validateIpcMessage({ ipcEvent });

        contactsRelayAllowedHosts.clear();
        if (Array.isArray(hosts)) {
            hosts
                .filter(isBareHostname)
                .slice(0, MAX_CONTACTS_RELAY_HOSTS)
                .forEach(host => {
                    contactsRelayAllowedHosts.add(host);
                    everAdmittedContactsRelayHosts.add(host);
                });
        }
        logger.info(
            SERVICE_NAME,
            `contacts relay allowlist set to ${contactsRelayAllowedHosts.size} host(s)`,
        );
    });
};
