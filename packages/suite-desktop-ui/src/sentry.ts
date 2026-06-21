import { type BrowserOptions, init } from '@sentry/electron/renderer';

import { SENTRY_BROWSER_CONFIG } from '@suite/sentry';

const ELECTRON_RENDERER_SENTRY_CONFIG = {
    ...SENTRY_BROWSER_CONFIG,
    integrations: defaults => [...defaults, ...SENTRY_BROWSER_CONFIG.integrations],
} satisfies BrowserOptions;

export const initSentry = () => {
    init(ELECTRON_RENDERER_SENTRY_CONFIG);
};
