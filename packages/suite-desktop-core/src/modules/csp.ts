/**
 * Adds a CSP (Content Security Policy) header to all requests
 */

import { session } from 'electron';

import type { ModuleInit } from './module';

export const SERVICE_NAME = 'csp';

type CreateCspRulesParams = {
    nonce: string;
};

// eslint-disable-next-line no-empty-pattern
const createCspRules = ({}: CreateCspRulesParams) => [
    // Default to only own resources
    "default-src 'self'",
    "script-src 'self'",
    `style-src 'self' 'unsafe-inline'`,
    // Allow all API calls (Can't be restricted bc of custom backends)
    'connect-src *',
    // Allow images from trezor.io
    "img-src 'self' blob: data: https://*.trezor.io",
];

export const init: ModuleInit = ({ cspNonce }) => {
    const { logger } = global;

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        logger.debug(SERVICE_NAME, `Header applied to ${details.url}`);
        callback({
            responseHeaders: {
                'Content-Security-Policy': [createCspRules({ nonce: cspNonce }).join(';')],
                ...details.responseHeaders,
            },
        });
    });
};
