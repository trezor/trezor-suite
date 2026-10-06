import { type BrowserOptions, init } from '@sentry/browser';

import { SENTRY_BROWSER_CONFIG, getCommonBrowserIntegrations } from '@suite/sentry';

const BROWSER_SENTRY_CONFIG: BrowserOptions = {
    ...SENTRY_BROWSER_CONFIG,
    // Important: must be a function to keep default Sentry integrations; an array would mean ONLY those specific integrations.
    integrations: defaults => [
        ...defaults.filter(i => i.name !== 'BrowserSession'),
        ...getCommonBrowserIntegrations(),
    ],
};

export const initSentry = () => {
    init(BROWSER_SENTRY_CONFIG);
};
