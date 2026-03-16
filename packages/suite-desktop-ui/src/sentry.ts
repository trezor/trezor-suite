import { type BrowserOptions, captureConsoleIntegration, init } from '@sentry/electron/renderer';

import { SENTRY_CONFIG } from '@suite/sentry';

const ELECTRON_RENDERER_SENTRY_CONFIG = {
    ...SENTRY_CONFIG,
    // BrowserSession is not present in Electron renderer process so we don't have to remove it
    integrations: defaults => [...defaults, captureConsoleIntegration({ levels: ['error'] })],
} as BrowserOptions;

export const initSentry = () => {
    init(ELECTRON_RENDERER_SENTRY_CONFIG);
};
