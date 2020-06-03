import { CaptureConsole } from '@sentry/integrations';

export default {
    dsn: 'https://6d91ca6e6a5d4de7b47989455858b5f6@o117836.ingest.sentry.io/5193825',
    debug: true,
    normalizeDepth: 10,
    integrations: [
        new CaptureConsole({
            levels: ['error'],
        }),
    ],
    release: process.env.COMMITHASH,
    environment: process.env.SUITE_TYPE,
};
