// This file is loaded by the Vite config, which Node runs without a bundler. It therefore must
// not import application modules. A unit test keeps the hosts below in sync with the ones the
// application really connects to.

/** The bridge inside Trezor Suite desktop. */
export const BRIDGE_ORIGIN = 'http://127.0.0.1:21328';

/** Trezor's Bitcoin, Ethereum and Ethereum Classic blockbooks, reached over WebSocket. */
export const BLOCKBOOK_ORIGINS = [
    'wss://btc.trezor.io',
    'wss://eth.trezor.io',
    'wss://etc.trezor.io',
];

/**
 * The page may load code only from its own origin and may talk only to the bridge inside
 * Trezor Suite and to Trezor's blockbooks.
 *
 * `style-src 'unsafe-inline'` is required by styled-components, which injects its style sheets
 * at runtime. Trezor Suite Web ships the same exception.
 */
export const CONTENT_SECURITY_POLICY = [
    "default-src 'self'",
    "script-src 'self'",
    "worker-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `connect-src ${[BRIDGE_ORIGIN, ...BLOCKBOOK_ORIGINS].join(' ')}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
].join('; ');

/**
 * Response headers the production hosting must send. `vite preview` applies them too, so that
 * a production build can be tried locally under the same restrictions.
 */
export const PRODUCTION_SECURITY_HEADERS = {
    'Content-Security-Policy': CONTENT_SECURITY_POLICY,
    'Permissions-Policy': 'local-network-access=(self), usb=(), hid=()',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'Cross-Origin-Opener-Policy': 'same-origin',
};
