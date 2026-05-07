import type { SecurityHeaders } from '../types/securityHeaders';
import { formatContentSecurityPolicy } from '../utils/csp';
import { createReportingHeaders } from '../utils/reportingHeaders';

const SENTRY_REPORT_URL =
    'https://o117836.ingest.us.sentry.io/api/5193825/security/?sentry_key=6d91ca6e6a5d4de7b47989455858b5f6';

/**
 * Response security headers applied during `yarn build:preview` / `yarn preview` command.
 * - There's equal to the ones deployed in production (https://suite.trezor.io).
 */
const PRODUCTION_SECURITY_HEADERS = {
    /**
     * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
     */
    'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',

    /**
     * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Upgrade-Insecure-Requests
     */
    'upgrade-insecure-requests': '1',

    /**
     * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
     */
    'x-content-type-options': 'nosniff',

    /**
     * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
     * Prevent non-https://suite.trezor.io websites from embedding our website in their iframe.
     */
    'x-frame-options': 'SAMEORIGIN',

    /**
     * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Permissions_Policy
     * Restrict browser powerful features to the minimum required set.
     * - Keep WebUSB, camera, clipboard write and local network access available only for this origin.
     * - Explicitly disable unrelated features.
     * It's experimental feature and not supported by all browsers.
     */
    'permissions-policy':
        'usb=(self), camera=(self), clipboard-write=(self), local-network-access=(self), geolocation=(), microphone=(), payment=(), hid=(), serial=(), fullscreen=(), accelerometer=(), gyroscope=(), magnetometer=(), storage-access=(), bluetooth=(), clipboard-read=(), display-capture=(), picture-in-picture=(), idle-detection=(), screen-wake-lock=()',

    /**
     * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy
     * This header prevents URL data leakage for foreign sites.
     * If user clicks on a link redirecting to another (non suite.trezor.io) site, the site receives only `https://suite.trezor.io` in the referrer response header instead of whole URL
     * It won't receive the referrer header if the target site doesn't use https.
     */
    'referrer-policy': 'strict-origin-when-cross-origin',

    /**
     * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy
     * The `same-origin` header ensures the `window.opener` is `null` even without explicitly using `noopener` unless it opens website of same origin.
     * So foreign sites can't get reference and potentially exploit the Window object.
     */
    'cross-origin-opener-policy': 'same-origin',

    'content-security-policy': {
        'default-src': ['self'],
        'script-src-attr': ['none'],
        'style-src': ['self', 'unsafe-inline'],
        'style-src-elem': ['self', 'unsafe-inline'],
        'img-src': ['self', 'blob:', 'data:', 'https://*.trezor.io'],
        // connect-src is permissive because custom backends need arbitrary domains.
        // Note that connect-src is a CSP policy that has nothing to do with the former TrezorConnect parameter of the same name
        'connect-src': ['data:', '*'],
        'upgrade-insecure-requests': true,
        'script-src': ['self'],
        'form-action': ['self'],
        'frame-ancestors': ['self'],
        'base-uri': ['none'],
        'object-src': ['self'],
        // trezorsuite deeplinks are opened using iframes to avoid issues with navigation
        'frame-src': ['self', 'trezorsuite://*'],
        'report-uri': SENTRY_REPORT_URL,
        'report-to': 'csp-endpoint',
    },

    ...createReportingHeaders('csp-endpoint', SENTRY_REPORT_URL),
} as const satisfies Partial<SecurityHeaders>;

export function getSecurityHeaders() {
    return {
        ...PRODUCTION_SECURITY_HEADERS,
        'content-security-policy': formatContentSecurityPolicy(
            PRODUCTION_SECURITY_HEADERS['content-security-policy'],
        ),
    } as const;
}
