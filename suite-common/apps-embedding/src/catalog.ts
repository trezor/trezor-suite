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
                popupExternalOrigins: ['https://pay.google.com', 'https://accounts.google.com'],
            },
            {
                kind: 'mobile',
                expectedBehavior:
                    'Google Pay does not work in plain WebViews at all — it requires Chrome Custom Tabs.',
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
            },
            {
                kind: 'mobile',
                expectedBehavior:
                    'The page loads, but Google refuses OAuth in embedded webviews (disallowed_useragent).',
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
];

export const getAppsEmbeddingCatalogEntry = (id: string): AppsEmbeddingCatalogEntry | undefined =>
    APPS_EMBEDDING_CATALOG.find(entry => entry.id === id);

export const getAppsEmbeddingCatalogEntryUrl = (
    entry: AppsEmbeddingCatalogEntry,
    params: AppsEmbeddingCatalogEntryUrlParams,
): HttpsUrl => (typeof entry.url === 'function' ? entry.url(params) : entry.url);
