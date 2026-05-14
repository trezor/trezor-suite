/**
 * Adds a CSP (Content Security Policy) header to all requests
 */

import { session } from 'electron';

import type { ModuleInit } from './module';

export const SERVICE_NAME = 'csp';

type CreateCspRulesParams = {
    nonce: string;
};

const createCspRules = ({ nonce }: CreateCspRulesParams) => [
    // Default to only own resources
    "default-src 'self'",
    "script-src 'self'",
    `style-src 'self' 'nonce-${nonce}'`,
    // connect-src is permissive because custom backends need arbitrary domains.
    // The request-filter module provides additional domain-level allowlisting.
    // Note that connect-src is a CSP policy that has nothing to do with the former TrezorConnect parameter of the same name
    'connect-src data: *',
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
