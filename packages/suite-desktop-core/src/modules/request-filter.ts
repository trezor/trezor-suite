/**
 * Request Filter feature (blocks non-allowed requests)
 */
import { captureMessage } from '@sentry/electron/main';

import { allowedDomains } from '../config';

import type { ModuleInit } from './index';

export const SERVICE_NAME = 'request-filter';

export const init: ModuleInit = ({ interceptor }) => {
    const { logger } = global;

    interceptor.onBeforeRequest(details => {
        const { hostname } = new URL(details.url);

        if (allowedDomains.find(d => hostname.endsWith(d)) !== undefined) {
            logger.info(
                SERVICE_NAME,
                `${details.url} was allowed because ${hostname} is in the exception list`,
            );

            return;
        }

        logger.warn(
            SERVICE_NAME,
            `${details.url} was blocked because ${hostname} is not in the exception list`,
        );
        captureMessage(`request-filter: ${hostname}`, 'warning');

        return { cancel: true };
    });
};
