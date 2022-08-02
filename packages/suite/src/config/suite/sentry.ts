import { CaptureConsole, Dedupe } from '@sentry/integrations';
import { isDev } from '@suite-utils/build';
import { beforeSend, beforeBreadcrumb } from '@suite-utils/sentry';

import type { Options } from '@sentry/types';

const ignoreErrors = [
    'ERR_INTERNET_DISCONNECTED',
    'ERR_NETWORK_IO_SUSPENDED',
    'ERR_NETWORK_CHANGED',
    'Error: HTTP Error',
    'other call in progress',
    'Action cancelled by user',
    'ResizeObserver loop limit exceeded',
    'device disconnected during action',
];

const config: Options = {
    dsn: 'https://6d91ca6e6a5d4de7b47989455858b5f6@o117836.ingest.sentry.io/5193825',
    autoSessionTracking: false, // do not send analytical data to Sentry
    integrations: [
        new CaptureConsole({
            levels: ['error'],
        }),
        new Dedupe(),
    ],
    beforeSend,
    enabled: !isDev,
    release: process.env.SENTRY_RELEASE,
    environment: process.env.SUITE_TYPE,
    normalizeDepth: 4,
    maxBreadcrumbs: 40,
    beforeBreadcrumb,
    ignoreErrors,
    initialScope: {
        tags: {
            version: process.env.VERSION || 'undefined',
        },
    },
};

export default config;
