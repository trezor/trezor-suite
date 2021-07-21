import { CaptureConsole, Dedupe } from '@sentry/integrations';
import { BrowserOptions } from '@sentry/browser';

export default {
    dsn: 'https://6d91ca6e6a5d4de7b47989455858b5f6@o117836.ingest.sentry.io/5193825',
    normalizeDepth: 10,
    sampleRate: 0.5,
    integrations: [
        new CaptureConsole({
            levels: ['error'],
        }),
        new Dedupe(),
    ],
    release: process.env.SENTRY_RELEASE,
    environment: process.env.SUITE_TYPE,
} as BrowserOptions;
