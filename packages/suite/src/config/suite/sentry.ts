import { CaptureConsole, Dedupe } from '@sentry/integrations';
import { isDev } from '@suite-utils/build';
import { redactUserPathFromString } from '@trezor/utils';

import type { Options, Event } from '@sentry/types';

export const allowReportTag = 'allowReport';

/**
 * Full user path could be part of reported error in some cases and we want to actively filter username out.
 * The user path could appear on multiple places in Sentry event (event.message, event.extra.arguments,
 * exception.values[0].value, breadcrumb.message). To filter it on all possible places, Sentry event
 * is stringified first, then username is redacted in the whole string and event is parsed back.
 *
 * In case of any issue during parsing, original error is reported just with extra redactUserPathFailed tag
 * to be able to see in Sentry if there are any issues in this approach.
 */
const redactUserPath = (event: Event) => {
    try {
        const eventAsString = JSON.stringify(event);
        const redactedString = redactUserPathFromString(eventAsString);
        return JSON.parse(redactedString);
    } catch (error) {
        console.warn('Redacting user path failed', error);
        event.tags = {
            redactUserPathFailed: true, // to be able to see in Sentry if there are such an errors
            ...event.tags,
        };
        return event;
    }
};

export const beforeSend: Options['beforeSend'] = event => {
    // sentry events are skipped until user confirm analytics reporting
    const allowReport = event.tags?.[allowReportTag];
    if (allowReport === false) {
        return null;
    }
    // allow report error without breadcrumbs before confirm status is loaded (@storage/loaded)
    if (typeof allowReport === 'undefined') {
        delete event.breadcrumbs;
    }

    return redactUserPath(event);
};

export const beforeBreadcrumb: Options['beforeBreadcrumb'] = breadcrumb => {
    // filter out analytics requests and image fetches
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
