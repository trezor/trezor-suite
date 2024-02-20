import { CaptureConsole, Dedupe } from '@sentry/integrations';
import type { Options, Event as SentryEvent } from '@sentry/types';

import { isDevEnv } from '@suite-common/suite-utils';
import { redactUserPathFromString } from '@trezor/utils';

export const allowReportTag = 'allowReport';
export const coinjoinReportTag = 'coinjoinReport';
export const coinjoinNetworkTag = 'coinjoinNetwork';

/**
 * Full user path could be part of reported error in some cases and we want to actively filter username out.
 * The user path could appear on multiple places in Sentry event (event.message, event.extra.arguments,
 * exception.values[0].value, breadcrumb.message). To filter it on all possible places, Sentry event
 * is stringified first, then username is redacted in the whole string and event is parsed back.
 *
 * In case of any issue during parsing, original error is reported just with extra redactUserPathFailed tag
 * to be able to see in Sentry if there are any issues in this approach.
 */

const redactUserPath = (event: SentryEvent) => {
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

    // send only what is really necessary from coinjoin
    if (event.tags?.[coinjoinReportTag]) {
        return {
            message: event.message,
            release: event.release,
            level: event.level,
            tags: {
                coinjoinReport: true,
                coinjoinNetworkTag: event.tags?.[coinjoinNetworkTag],
            },
        };
    }

    return redactUserPath(event);
};

const beforeBreadcrumb: Options['beforeBreadcrumb'] = breadcrumb => {
    // filter out analytics requests and image fetches
    const isAnalytics =
        breadcrumb.category === 'fetch' &&
        breadcrumb.data?.url?.contains?.('data.trezor.io/suite/log');
    const isImageFetch =
        breadcrumb.category === 'xhr' && breadcrumb.data?.url?.contains?.('/assets/');
    const isConsole = breadcrumb.category === 'console';

    if (isAnalytics || isImageFetch || isConsole) {
        return null;
    }

    return breadcrumb;
};

const ignoreErrors = [
    'ERR_INTERNET_DISCONNECTED',
    'ERR_NETWORK_IO_SUSPENDED',
    'ERR_NETWORK_CHANGED',
    'Error: HTTP Error',
    'ResizeObserver loop limit exceeded',
    // comes from bridge originally, we allowed user to init another connect call. should now be wrapped however and not thrown on transport layer
    'other call in progress',
    'Action cancelled by user',
    'device disconnected during action', // the same as with 'other call in progress'
];

export const SENTRY_CONFIG: Options = {
    dsn: 'https://6d91ca6e6a5d4de7b47989455858b5f6@o117836.ingest.sentry.io/5193825',
    autoSessionTracking: false, // do not send analytical data to Sentry
    integrations: [
        new CaptureConsole({
            levels: ['error'],
        }),
        new Dedupe(),
    ],
    beforeSend,
    enabled: !isDevEnv,
    maxValueLength: 500, // default 250 is not enough for some errors
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
