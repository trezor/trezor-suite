/**
 * Request Filter feature (blocks non-allowed requests)
 */
import { captureMessage } from '@sentry/electron';

import { allowedDomains } from '../config';

import type { Module } from './index';

export const SERVICE_NAME = 'request-filter';

export const init: Module = ({ interceptor }) => {
    const { logger } = global;

    const resourceTypeFilter = ['xhr']; // What resource types we want to filter
    interceptor.onBeforeRequest(details => {
        if (!resourceTypeFilter.includes(details.resourceType)) {
            logger.debug(
                SERVICE_NAME,
                `${details.url} was allowed because its resource type (${details.resourceType}) is not filtered`,
            );

            return;
        }

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
