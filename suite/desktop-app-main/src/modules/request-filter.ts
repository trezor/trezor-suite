/**
 * Request Filter feature (blocks non-allowed requests)
 */
import { captureMessage } from '@sentry/electron/main';

import { isWhitelistedHost } from '@trezor/utils';

import { allowedDomains, silentlyBlockedDomains } from '../config';
import { ipcMain } from '../ipcMain';
import type { ModuleInit } from './module';
import { validateWhitelistedHostname } from '../libs/validateWhitelistedHostname';

export const SERVICE_NAME = 'request-filter';

/**
 * This module handles request interception for the Electron Renderer thread. Requests are happening
 * in the Chromium browser (the Electron binary itself), so we have to relay on the api we get from Electron
 * (it falls down to `session.defaultSession.webRequest.onBeforeRequest`).
 *
 * The actual interception is done in `createElectronSessionInterceptor`, injected when loading modules.
 */
export const init: ModuleInit = ({ interceptor, logger }) => {
    // Nodes the renderer reads directly, e.g. those of a runtime network the user turned on. Like
    // custom backends in the main process, they stay allowed until the app quits.
    const chainNodeHosts: string[] = [];

    ipcMain.handle('request-filter/allow-chain-node-host', (_, hostname: string) => {
        const validatedHostname =
            typeof hostname === 'string'
                ? validateWhitelistedHostname({
                      hostname,
                      warn: message => logger.warn(SERVICE_NAME, message),
                  })
                : undefined;

        if (validatedHostname === undefined) {
            return { success: false, error: 'invalid hostname' };
        }

        if (!chainNodeHosts.includes(validatedHostname)) {
            chainNodeHosts.push(validatedHostname);
            logger.info(SERVICE_NAME, `${validatedHostname} was allowed as a chain node`);
        }

        return { success: true };
    });

    interceptor.onBeforeRequest(details => {
        const { hostname } = new URL(details.url);

        if (isWhitelistedHost(hostname, allowedDomains)) {
            logger.info(
                SERVICE_NAME,
                `${details.url} was allowed because ${hostname} is in the exception list`,
            );

            return;
        }

        if (isWhitelistedHost(hostname, chainNodeHosts)) {
            // Only the host is logged: the request URL may carry an API key of the user's node.
            logger.debug(SERVICE_NAME, `request to ${hostname} was allowed as a chain node`);

            return;
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
};
