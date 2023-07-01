/**
 * Adds a CSP (Content Security Policy) header to all requests
 */

import { session } from 'electron';

import * as config from '../config';

import { Module } from './index';

export const init: Module = () => {
    const { logger } = global;

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        logger.debug('csp', `Header applied to ${details.url}`);
        callback({
            responseHeaders: {
                'Content-Security-Policy': [config.cspRules.join(';')],
                ...details.responseHeaders,
            },
        });
    });
};
