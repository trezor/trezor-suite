import { CaptureConsole, Dedupe } from '@sentry/integrations';
import { isDev } from '@suite-utils/build';

import type { Options } from '@sentry/types';

export const allowReportTag = 'allowReport';

/**
 * From paths like /Users/username/, C:\Users\username\, this matches /Users/ or \Users\ as first group
 * and text (supposed to be a username) between that and the next slash as second group.
 */
const startOfUserPathRegex = /([/\\][Uu]sers[/\\]{1,2})([^/^\\]*)/;

/**
 * Full user path could be part of reported error in some cases and we want to actively filter username out.
 */
const redactUserPath = (value?: string) => {
    if (value && typeof value === 'string') {
        return value.replace(startOfUserPathRegex, '$1[redacted]');
    }
    return value;
};

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

    event.message = redactUserPath(event.message);

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
    breadcrumb.message = redactUserPath(breadcrumb.message);

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
    enabled: !isDev,
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
