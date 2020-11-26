/**
 * Request Filter feature (blocks non-allowed requests and displays a warning)
 */
import { dialog, session, BrowserWindow } from 'electron';

import * as config from '../config';

const init = (window: BrowserWindow) => {
    const resourceTypeFilter = ['xhr']; // What resource types we want to filter
    const caughtDomainExceptions: string[] = []; // Domains that have already shown an exception
    session.defaultSession.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, cb) => {
        if (!resourceTypeFilter.includes(details.resourceType)) {
            cb({ cancel: false });
            return;
        }

        const { hostname } = new URL(details.url);

        // Cancel requests that aren't allowed
        if (config.allowedDomains.find(d => hostname.endsWith(d)) !== undefined) {
            cb({ cancel: false });
            return;
        }

        if (caughtDomainExceptions.find(d => d === hostname) === undefined) {
            caughtDomainExceptions.push(hostname);
            dialog.showMessageBox(window, {
                type: 'warning',
                message: `Suite blocked a request to ${hostname}.\n\nIf you believe this is an error, please contact our support.`,
                buttons: ['OK'],
            });
        }

        console.warn(`[Warning] Domain '${hostname}' was blocked.`);
        cb({ cancel: true });
    });
};

export default init;
