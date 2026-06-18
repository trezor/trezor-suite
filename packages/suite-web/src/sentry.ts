import { type BrowserOptions, init } from '@sentry/browser';

import { SENTRY_BROWSER_CONFIG } from '@suite/sentry';

const BROWSER_SENTRY_CONFIG: BrowserOptions = {
    ...SENTRY_BROWSER_CONFIG,
    integrations: defaults => [
        ...defaults.filter(i => i.name !== 'BrowserSession'),
        ...SENTRY_BROWSER_CONFIG.integrations,
    ],
};

export const initSentry = () => {
    init(BROWSER_SENTRY_CONFIG);
};
