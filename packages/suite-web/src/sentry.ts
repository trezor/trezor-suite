import { type BrowserOptions, captureConsoleIntegration, init } from '@sentry/browser';

import { SENTRY_CONFIG } from '@suite/sentry';

const BROWSER_SENTRY_CONFIG: BrowserOptions = {
    ...SENTRY_CONFIG,
    integrations: defaults => [
        ...defaults.filter(i => i.name !== 'BrowserSession'),
        captureConsoleIntegration({ levels: ['error'] }),
    ],
};

export const initSentry = () => {
    init(BROWSER_SENTRY_CONFIG);
};
