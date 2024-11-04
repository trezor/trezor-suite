/**
 * Adds a CSP (Content Security Policy) header to all requests
 */

import { session } from 'electron';

import * as config from '../config';

import type { ModuleInit } from './index';

export const SERVICE_NAME = 'csp';

export const init: ModuleInit = () => {
    const { logger } = global;

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        logger.debug(SERVICE_NAME, `Header applied to ${details.url}`);
        callback({
            responseHeaders: {
                'Content-Security-Policy': [config.cspRules.join(';')],
                ...details.responseHeaders,
            },
        });
    });
};
