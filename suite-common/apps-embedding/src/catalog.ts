import { isCodesignBuild } from '@trezor/env-utils';
import { type HttpsUrl } from '@trezor/type-utils';

import { type AppsEmbeddingCatalogEntry, type AppsEmbeddingCatalogEntryUrlParams } from './types';

// Each site lets only the Suite origin of its own environment frame it, so a develop build has to
// embed the develop site.
const getTrezorIoOrigin = (): HttpsUrl =>
    isCodesignBuild() ? 'https://trezor.io' : 'https://dev.trezorio.sldev.cz';

// The locale segment of a trezor.io path, per Suite locale. Checked against trezor.io on
// 2026-09-23: it has no pages for the other Suite locales and answers them with a 404.
const TREZOR_IO_LOCALES: Partial<Record<string, string>> = {
    'en-US': 'en',
    'cs-CZ': 'cs',
    'de-DE': 'de',
    'es-ES': 'es',
    'fr-FR': 'fr',
    'id-ID': 'id',
    'ja-JP': 'ja',
    'pt-BR': 'pt-br',
    'zh-CN': 'zh-cn',
};

const TREZOR_IO_FALLBACK_LOCALE = 'en';

const getTrezorIoLocale = (locale: string) =>
    TREZOR_IO_LOCALES[locale] ?? TREZOR_IO_FALLBACK_LOCALE;

// Curated showcase catalog. The entries deliberately include sites where the
// exercised API does NOT work in an embedded context — documenting the failure
// mode per platform is the purpose of the showcase (see issue #31888).
export const APPS_EMBEDDING_CATALOG: AppsEmbeddingCatalogEntry[] = [
    {
        id: 'example-com',
        name: 'example.com',
        description: 'Plain frameable page — the control entry with no special API usage.',
        url: 'https://example.com/',
        communication: [],
        platformSpecific: [
            {
                kind: 'web',
                expectedBehavior:
                    'Renders in dev (no CSP). Blocked by frame-src in preview/production builds.',
            },
            {
                kind: 'desktop',
                expectedBehavior:
                    'Renders in the WebContentsView — its own session bypasses the renderer CSP and request filter.',
            },
            {
                kind: 'mobile',
                expectedBehavior:
                    'Renders in the WebView — a top-level browsing context, no framing rules apply.',
            },
        ],
    },
    {
        id: 'tor-check',
        name: 'Tor check',
        description:
            "check.torproject.org — reports whether the visitor arrived over Tor and from which address. A quick way to see that the embedded page follows Suite's Tor setting; meaningful on desktop only, the one platform where Suite routes anything through Tor.",
        url: 'https://check.torproject.org/',
        communication: [],
        platformSpecific: [
            {
                kind: 'web',
                expectedBehavior:
                    "Suite web routes nothing through Tor, so the page can only report the browser's own address. Whether it renders at all depends on the site's framing headers and, in preview/production builds, on frame-src.",
            },
            {
                kind: 'desktop',
                expectedBehavior:
                    'With Tor off the page says the browser is not using Tor and shows the real address (via the system proxy, if any). With Tor on it congratulates and shows a Tor exit address; opened while Tor is still bootstrapping it fails to load rather than leaking, since the session is already routed. Toggling Tor while the page is open drops its connections — reload and the verdict flips.',
            },
            {
                kind: 'mobile',
                expectedBehavior:
                    "Suite mobile has no Tor at all; the page reports the device's own address.",
            },
        ],
    },
    {
        id: 'apple-pay-demo',
        name: 'Apple Pay demo',
        description: 'Apple demo merchant exercising the ApplePaySession API.',
        url: 'https://applepaydemo.apple.com/',
        platformSpecific: [
            {
                kind: 'web',
                expectedBehavior:
                    'The site forbids framing. ApplePaySession is undefined in Chromium; Safari would additionally require merchant domain registration.',
                allow: 'payment',
            },
            {
                kind: 'desktop',
                expectedBehavior:
                    'ApplePaySession is undefined in Electron (Chromium) — the page should say Apple Pay is unavailable.',
            },
            {
                kind: 'mobile',
                expectedBehavior:
                    'WKWebView exposes Apple Pay JS only behind the enableApplePay prop (which disables JS injection); unavailable on Android WebView.',
            },
        ],
        communication: [],
    },
    {
        id: 'google-pay-demo',
        name: 'Google Pay demo',
        description: 'Official Google Pay web demo store exercising the Google Pay button flow.',
        url: 'https://gpay-live-demo.web.app/',
        platformSpecific: [
            {
                kind: 'web',
                expectedBehavior:
                    'Frames fine (no frame-ancestors as of 2026-09). The button loads from pay.google.com; opening the payment sheet needs a popup — observe whether it opens or is blocked.',
                allow: 'payment',
            },
            {
                kind: 'desktop',
                expectedBehavior:
                    'Loads in the WebContentsView. The sheet opens as a child window of Suite because pay.google.com is in popupExternalOrigins; where a popup is refused the site falls back to a top-level redirect, which redirectExternalOrigins permits. Any hop off both lists is blocked and shows up in the log. This entry persists its session, so a Google sign-in survives a restart — for the popup too — until its data is forgotten from the catalog row. Compare with the system-browser variant below.',
                // A signed-in Google account is what makes the sheet reachable at all on a second
                // run, so this is the entry where persistence is worth demonstrating.
                persistSession: true,
                // The flow continues to following origins
                redirectExternalOrigins: ['https://pay.google.com', 'https://accounts.google.com'],
                // The sheet prefers a window of its own — it posts the result back through
                // window.opener — and the sign-in step inside it does the same.
                popupExternalOrigins: [
                    'https://pay.google.com',
                    'https://accounts.google.com',
                    'https://accounts.youtube.com',
                    'https://accounts.google.cz',
                ],
            },
            {
                kind: 'mobile',
                expectedBehavior:
                    "Google's web SDK does not support iOS web views, and Android WebView shows the sheet only with the Payment Request API switched on (Android System WebView 137+, not enabled in Suite), so the button does nothing in the WebView on either platform. The sheet needs a popup, which the WebView denies, and the site then redirects at the top level instead, which originWhitelist permits. The system browser runs the flow; persistSession keeps its Google sign-in between openings on iOS, and Chrome Custom Tabs keep it regardless.",
                // As on desktop, a Google account that stays signed in is what makes the sheet
                // reachable at all on a second run.
                persistSession: true,
                // Where the popup is denied the site falls back to a top-level redirect, and the
                // sign-in step inside it hops the same way.
                originWhitelist: ['https://pay.google.com', 'https://accounts.google.com'],
            },
        ],
        communication: [],
    },
    {
        id: 'google-sign-in',
        name: 'Google Sign-In',
        description: 'accounts.google.com — refuses framing via X-Frame-Options: DENY.',
        url: 'https://accounts.google.com/',
        communication: [],
        platformSpecific: [
            {
                kind: 'web',
                expectedBehavior:
                    'Iframe refused (X-Frame-Options: DENY) — observe how the refusal renders.',
            },
            {
                kind: 'desktop',
                expectedBehavior:
                    'Loads in the WebContentsView — X-Frame-Options does not apply to a top-level browsing context.',
                popupExternalOrigins: ['https://accounts.youtube.com'],
            },
            {
                kind: 'mobile',
                expectedBehavior:
                    'The page loads, but Google refuses OAuth in embedded webviews (disallowed_useragent).',
                // Signing in bounces the main frame through accounts.youtube.com; on desktop the
                // same hop happens in a popup.
                originWhitelist: ['https://accounts.youtube.com'],
            },
        ],
    },
    {
        id: 'payment-request-demo',
        name: 'Payment Request API demo',
        description: 'W3C Payment Request API demo collection.',
        url: 'https://rsolomakhin.github.io/pr/',
        communication: [],
        platformSpecific: [
            {
                kind: 'web',
                expectedBehavior:
                    'PaymentRequest available in dev; denied by permissions-policy payment=() in preview/production.',
                allow: 'payment',
            },
            {
                kind: 'desktop',
                expectedBehavior:
                    'PaymentRequest constructor exists but Electron ships no payment apps.',
            },
            {
                kind: 'mobile',
                expectedBehavior:
                    'PaymentRequest API is not implemented in WKWebView or Android WebView.',
            },
        ],
    },
    {
        id: 'trezor-guides',
        name: 'Trezor guides',
        description:
            'Guides on trezor.io in the Suite language — from dev.trezorio.sldev.cz in builds that are not codesigned.',
        url: ({ locale }) => `${getTrezorIoOrigin()}/${getTrezorIoLocale(locale)}/guides`,
        communication: [],
        platformSpecific: [
            {
                kind: 'web',
                expectedBehavior:
                    "Renders only while the site's frame-ancestors lists the origin Suite runs on. As of 2026-09-23 production trezor.io still sends frame-ancestors 'none' and X-Frame-Options: DENY, preview/production Suite builds block it with their own frame-src first, and the develop site frames its 401 page until it gets HTTP Basic credentials.",
            },
            {
                kind: 'desktop',
                expectedBehavior:
                    'Loads in the WebContentsView — frame-ancestors and X-Frame-Options do not apply to a top-level browsing context. A develop build gets a 401 from the develop site: nothing answers its HTTP Basic challenge, and Electron cancels one that goes unanswered.',
            },
            {
                kind: 'mobile',
                expectedBehavior:
                    'Loads in the WebView, a top-level browsing context. Expect a 401 from the develop site in a develop build: the WebView is given no basicAuthCredential to answer its HTTP Basic challenge with.',
            },
        ],
    },
    {
        id: 'qr-code-scanner',
        name: 'QR code scanner',
        description:
            'qrscanner.net — a QR code reader that scans the camera feed on the device (the nimiq qr-scanner library) and uploads images to its server for decoding. The camera entry: each host decides whether the page gets the camera at all, and the page shows what it got.',
        url: 'https://qrscanner.net/',
        communication: [],
        platformSpecific: [
            {
                kind: 'web',
                expectedBehavior:
                    'Iframe refused (X-Frame-Options: SAMEORIGIN as of 2026-10-21) — observe how the refusal renders. Were it framed, allow=camera would delegate the camera in dev only: preview/production builds block the frame with their own frame-src first and keep the camera from a cross-origin frame with permissions-policy camera=(self).',
                allow: 'camera',
            },
            {
                kind: 'desktop',
                expectedBehavior:
                    "Loads in the WebContentsView, but the in-app browser session refuses every permission, so the camera mode cannot start; image upload still works, decoded by the site's server behind a Cloudflare Turnstile check. A decoded link is a target=_blank anchor: denied and reported as a popup.",
            },
            {
                kind: 'mobile',
                expectedBehavior:
                    "Loads in the WebView. iOS denies the camera (EmbeddedAppWebView answers every capture request with deny), so the camera mode cannot start; Android WebView grants the camera once Suite holds the permission and asks the OS for it otherwise, so scanning works there. Image upload works on both, decoded by the site's server behind a Cloudflare Turnstile check. A decoded link is a target=_blank anchor: denied and reported as a popup. The scan history lives in localStorage, so it is gone on the next opening as long as the entry does not persist. In the system browser Safari or Chrome asks for the camera itself — on iOS in the ephemeral session this non-persisting entry gets; observe whether that one grants it too.",
            },
        ],
    },
];

export const getAppsEmbeddingCatalogEntry = (id: string): AppsEmbeddingCatalogEntry | undefined =>
    APPS_EMBEDDING_CATALOG.find(entry => entry.id === id);

export const getAppsEmbeddingCatalogEntryUrl = (
    entry: AppsEmbeddingCatalogEntry,
    params: AppsEmbeddingCatalogEntryUrlParams,
): HttpsUrl => (typeof entry.url === 'function' ? entry.url(params) : entry.url);
