/**
 * Request Filter feature (blocks non-allowed requests)
 */
import { captureMessage } from '@sentry/electron/main';

import { isWhitelistedHost } from '@trezor/utils';

import { allowedDomains, silentlyBlockedDomains } from '../config';
import type { ModuleInit } from './module';

export const SERVICE_NAME = 'request-filter';

/**
 * This module handles request interception for the Electron Renderer thread. Requests are happening
 * in the Chromium browser (the Electron binary itself), so we have to server on the api we get from Electron
 * (it falls down to `session.defaultSession.webRequest.onBeforeRequest`).
 *
 * The actual interception is done in `createElectronSessionInterceptor`, injected when loading modules.
 */
export const init: ModuleInit = ({ interceptor }) => {
    const { logger } = global;

    interceptor.onBeforeRequest(details => {
        const { hostname } = new URL(details.url);

        if (isWhitelistedHost(hostname, allowedDomains)) {
            logger.info(
                SERVICE_NAME,
                `${details.url} was allowed because ${hostname} is in the exception list`,
            );

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
