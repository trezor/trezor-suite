/**
 * Request Filter feature (blocks non-allowed requests)
 */
import { captureMessage, Severity } from '@sentry/electron';
import { allowedDomains } from '../config';
import { Module } from './index';

const init: Module = ({ interceptor }) => {
    const { logger } = global;

    const resourceTypeFilter = ['xhr']; // What resource types we want to filter
    interceptor.onBeforeRequest(details => {
        if (!resourceTypeFilter.includes(details.resourceType)) {
            logger.debug(
                'request-filter',
                `${details.url} was allowed because its resource type (${details.resourceType}) is not filtered`,
            );
            return;
        }

        const { hostname } = new URL(details.url);

        if (allowedDomains.find(d => hostname.endsWith(d)) !== undefined) {
            logger.info(
                'request-filter',
                `${details.url} was allowed because ${hostname} is in the exception list`,
            );
            return;
        }

        logger.warn(
            'request-filter',
            `${details.url} was blocked because ${hostname} is not in the exception list`,
        );
        captureMessage(`request-filter: ${hostname}`, Severity.Warning);
        return { cancel: true };
    });
};

export default init;
