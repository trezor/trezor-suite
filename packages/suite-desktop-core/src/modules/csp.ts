/**
 * Adds a CSP (Content Security Policy) header to all requests
 */

import { session } from 'electron';

import * as config from '../config';

import type { Module } from './index';

export const SERVICE_NAME = 'csp';

export const init: Module = () => {
    const { logger } = global;

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        logger.debug(SERVICE_NAME, `Header applied to ${details.url}`);
        callback({
            responseHeaders: {
                'Content-Security-Policy': [config.cspRules.join(';')],
                // Set COOP header
                'Cross-Origin-Opener-Policy': 'same-origin',
                // Set COEP header
                'Cross-Origin-Embedder-Policy': 'require-corp',
                ...details.responseHeaders,
            },
        });
    });
};
