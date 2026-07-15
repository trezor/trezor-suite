/**
 * Adds HTTP response headers (Document-Policy, Content-Security-Policy) to renderer responses.
 *
 * Electron's `session.webRequest.onHeadersReceived` allows only a single listener, so all
 * renderer response headers must be composed here rather than in separate modules.
 */

import { session } from 'electron';

import { isDevEnv } from '@suite-common/suite-utils';

import type { ModuleInit } from './module';

export const SERVICE_NAME = 'response-headers';

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
        logger.debug(SERVICE_NAME, `Response headers applied to ${details.url}`);
        callback({
            responseHeaders: {
                // Document-Policy enables the JS Self-Profiling API used by Sentry's browserProfilingIntegration
                // in the renderer. It must be delivered as an HTTP response header (there is no <meta> equivalent).
                'Document-Policy': ['js-profiling'],
                // CSP is enforced only in production builds; the dev server runs with `webSecurity: false`
                // and needs a looser policy (eval, HMR), so CSP is intentionally omitted in development.
                ...(isDevEnv
                    ? {}
                    : {
                          'Content-Security-Policy': [
                              createCspRules({ nonce: cspNonce }).join(';'),
                          ],
                      }),
                ...details.responseHeaders,
            },
        });
    });
};
