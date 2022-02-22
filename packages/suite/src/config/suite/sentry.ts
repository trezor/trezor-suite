import { CaptureConsole, Dedupe } from '@sentry/integrations';
import type { Options } from '@sentry/types';

export const allowReportTag = 'allowReport';

const beforeSend: Options['beforeSend'] = event => {
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
};

const beforeBreadcrumb: Options['beforeBreadcrumb'] = breadcrumb => {
    // filter out analytics requests and image fetche
    const isAnalytics =
        breadcrumb.category === 'fetch' &&
        breadcrumb.data?.url?.contains('data.trezor.io/suite/log');
    const isImageFetch =
        breadcrumb.category === 'xhr' && breadcrumb.data?.url?.contains('/assets/');

    if (isAnalytics || isImageFetch) {
        return null;
    }
    return breadcrumb;
};

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
    release: process.env.SENTRY_RELEASE,
    environment: process.env.SUITE_TYPE,
    normalizeDepth: 4,
    maxBreadcrumbs: 30,
    beforeBreadcrumb,
    initialScope: {
        tags: {
            version: process.env.VERSION || 'undefined',
        },
    },
};

export default config;
