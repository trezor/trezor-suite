import type { ErrorEvent, Options } from '@sentry/core';

import { COINJOIN_NETWORK_TAG, COINJOIN_REPORT_TAG, commonBeforeSend } from '@suite-common/sentry';
import { isDevEnv } from '@suite-common/suite-utils';
import { isCodesignBuild } from '@trezor/env-utils';
import { redactUserPathFromString } from '@trezor/utils';

import { ignoreErrors } from './ignoreErrors';

/**
 * Full user path could be part of reported error in some cases and we want to actively filter username out.
 * The user path could appear on multiple places in Sentry event (event.message, event.extra.arguments,
 * exception.values[0].value, breadcrumb.message). To filter it on all possible places, Sentry event
 * is stringified first, then username is redacted in the whole string and event is parsed back.
 *
 * In case of any issue during parsing, original error is reported just with extra redactUserPathFailed tag
 * to be able to see in Sentry if there are any issues in this approach.
 *
 * This is relevant only on Desktop.
 */
const redactUserPath = (event: ErrorEvent): ErrorEvent => {
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

// Leaves only what is really necessary on a coinjoin error event
const redactCoinjoinData = (event: ErrorEvent): ErrorEvent => {
    if (event.tags?.[COINJOIN_REPORT_TAG]) {
        return {
            type: event.type,
            message: event.message,
            release: event.release,
            level: event.level,
            tags: {
                coinjoinReport: true,
                coinjoinNetworkTag: event.tags?.[COINJOIN_NETWORK_TAG],
            },
        };
    }

    return event;
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

export const SENTRY_CONFIG = {
    dsn: 'https://6d91ca6e6a5d4de7b47989455858b5f6@o117836.ingest.sentry.io/5193825',

    beforeSend: (event, hint) => commonBeforeSend(redactUserPath(redactCoinjoinData(event)), hint),
    enabled: !isDevEnv, // set to true to enable Sentry logging while testing locally
    maxValueLength: 500, // default 250 is not enough for some errors
    release: process.env.SENTRY_RELEASE,
    environment: isCodesignBuild() ? 'production' : 'develop',
    normalizeDepth: 4,
    maxBreadcrumbs: 40,
    beforeBreadcrumb,
    ignoreErrors,
    initialScope: {
        tags: {
            version: process.env.VERSION || 'undefined',
        },
    },
} satisfies Options;
