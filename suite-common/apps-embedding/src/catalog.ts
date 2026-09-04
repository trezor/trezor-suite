import { type AppsEmbeddingCatalogEntry } from './types';

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
                    'Loads in the WebContentsView; the payment-sheet popup hits the window-open deny, so expect a window.open attempt in the event log instead of a sheet.',
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
];

export const getAppsEmbeddingCatalogEntry = (id: string): AppsEmbeddingCatalogEntry | undefined =>
    APPS_EMBEDDING_CATALOG.find(entry => entry.id === id);
