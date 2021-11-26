/**
 * Request Filter feature (blocks non-allowed requests and displays a warning)
 */
import { dialog } from 'electron';
import * as config from '../config';

const domainFilter = () => {
    const allowedDomains = [...config.allowedDomains];

    const isAllowed = (hostname: string) =>
        allowedDomains.find(d => hostname.endsWith(d)) !== undefined;

    const addAllowed = (hostname: string) => allowedDomains.push(hostname);

    return { isAllowed, addAllowed };
};

const init = ({ mainWindow, interceptor }: Dependencies) => {
    const { logger } = global;

    const { isAllowed, addAllowed } = domainFilter();

    const resourceTypeFilter = ['xhr']; // What resource types we want to filter
    const caughtDomainExceptions: string[] = []; // Domains that have already shown an exception
    interceptor.onBeforeRequest(async details => {
        if (!resourceTypeFilter.includes(details.resourceType)) {
            logger.debug(
                'request-filter',
                `${details.url} was allowed because its resource type (${details.resourceType}) is not filtered`,
            );
            return;
        }

        const { hostname } = new URL(details.url);

        if (isAllowed(hostname)) {
            logger.info(
                'request-filter',
                `${details.url} was allowed because ${hostname} is in the exception list`,
            );
            return;
        }

        if (caughtDomainExceptions.find(d => d === hostname) === undefined) {
            const { response } = await dialog.showMessageBox(mainWindow, {
                type: 'warning',
                message: `Suite is trying to communicate with unknown host: ${hostname}.\n\nWould you like to allow the communication?`,
                buttons: ['Allow', 'Deny'],
            });
            if (response === 0) {
                addAllowed(hostname);
                logger.info('request-filter', `${details.url} was manually allowed by the user`);
                return;
            }
            caughtDomainExceptions.push(hostname);
        }

        logger.warn(
            'request-filter',
            `${details.url} was blocked because ${hostname} is not in the exception list`,
        );
        return { cancel: true };
    });
};

export default init;
