import { CaptureConsole, Dedupe } from '@sentry/integrations';
import { BrowserOptions } from '@sentry/browser';

export const allowReportTag = 'allowReport';

export default {
    dsn: 'https://6d91ca6e6a5d4de7b47989455858b5f6@o117836.ingest.sentry.io/5193825',
    autoSessionTracking: false, // do not send analytical data to Sentry
    integrations: [
        new CaptureConsole({
            levels: ['error'],
        }),
        new Dedupe(),
    ],
    beforeSend: event => {
        // sentry events are skipped until user confirm analytics reporting
        const allowReport = event.tags?.[allowReportTag];
        if (allowReport === false) {
            return null;
        }
        // allow report error without breadcrumbs before confirm status is loaded (@storage/loaded)
        if (typeof allowReport === 'undefined') {
            delete event.breadcrumbs;
        }
        return event;
    },
    release: process.env.SENTRY_RELEASE,
    environment: process.env.SUITE_TYPE,
} as BrowserOptions;
