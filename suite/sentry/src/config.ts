import {
    type BrowserOptions,
    browserProfilingIntegration,
    browserTracingIntegration,
    captureConsoleIntegration,
    elementTimingIntegration,
} from '@sentry/browser';
import type { Options } from '@sentry/core';

import {
    COINJOIN_NETWORK_TAG,
    COINJOIN_REPORT_TAG,
    type ChainableBeforeSend,
    redactInvalidParameterValue,
    redactSentryEvent,
} from '@suite-common/sentry';
import { isDevEnv } from '@suite-common/suite-utils';
import { isCodesignBuild } from '@trezor/env-utils';
import { redactUserPathFromString } from '@trezor/utils';

import { getAnalyticsConfirmedAndEnabled } from './consent';
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
export const redactUserPath: ChainableBeforeSend = event => {
    if (event === null) return null;
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
export const redactCoinjoinData: ChainableBeforeSend = event => {
    if (event === null) return null;
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

/**
 * Suite keeps route params in the URL query and hash, and some of them are confidential
 * (e.g. trading redirects carry amounts and payment ids, the web protocol handler an address),
 * so everything from the first `?` or `#` on is replaced.
 */
const redactUrlParams = (url: string) => url.replace(/([?#]).*$/s, '$1redacted');

const URL_BREADCRUMB_DATA_KEYS = ['url', 'from', 'to'];

// Covers the event fields that carry a Suite URL (breadcrumbs are handled in beforeBreadcrumb).
export const redactEventUrlParams: ChainableBeforeSend = event => {
    if (event === null) return null;

    if (event.request?.url) {
        event.request.url = redactUrlParams(event.request.url);
    }

    const { tags } = event;
    if (tags) {
        Object.entries(tags).forEach(([key, value]) => {
            if (typeof value === 'string') {
                tags[key] = redactUrlParams(value);
            }
        });
    }

    const electronContext = event.contexts?.electron;
    if (typeof electronContext?.crashed_url === 'string') {
        electronContext.crashed_url = redactUrlParams(electronContext.crashed_url);
    }

    return event;
};

const beforeSend: ChainableBeforeSend = event =>
    redactSentryEvent(
        redactInvalidParameterValue(
            redactUserPath(redactEventUrlParams(redactCoinjoinData(event))),
        ),
    );

export const beforeBreadcrumb: Options['beforeBreadcrumb'] = breadcrumb => {
    const { category, data } = breadcrumb;
    // Sentry types breadcrumb.data as arbitrary data object, making the `url` typed as `any`. We expect string.
    const url: unknown = data?.url;

    // filter out analytics requests and image fetches
    const isAnalytics =
        category === 'fetch' &&
        typeof url === 'string' &&
        url.includes?.('data.trezor.io/suite/log');
    const isImageFetch =
        category === 'xhr' && typeof url === 'string' && url.includes?.('/assets/');
    const isConsole = category === 'console';

    if (isAnalytics || isImageFetch || isConsole) {
        return null;
    }

    // Strip URLs inside breadcrumb items, as the URLs may be sensitive.
    if (data) {
        URL_BREADCRUMB_DATA_KEYS.forEach(key => {
            if (typeof data[key] === 'string') {
                data[key] = redactUrlParams(data[key]);
            }
        });
    }

    return breadcrumb;
};

const isProd = isCodesignBuild();

// Common Sentry config for all Suite Desktop & Web envs
export const SENTRY_CONFIG = {
    dsn: 'https://6d91ca6e6a5d4de7b47989455858b5f6@o117836.ingest.sentry.io/5193825',

    beforeSend,
    enabled: !isDevEnv, // set to true to enable Sentry logging while testing locally
    maxValueLength: 500, // default 250 is not enough for some errors
    release: process.env.SENTRY_RELEASE,
    environment: isProd ? 'production' : 'develop',
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

// Common Sentry config for Suite browser-based envs (i.e. Web & Electron Renderer, but not Electron Main)
export const SENTRY_BROWSER_CONFIG = {
    ...SENTRY_CONFIG,
    profileSessionSampleRate: isProd ? 0.1 : 1,
    tracesSampleRate: isProd ? 0.1 : 1,
    profileLifecycle: 'trace',
} satisfies BrowserOptions;

// Get Sentry integrations common for Suite browser-based envs, that should be added on top of the default ones.
export const getCommonBrowserIntegrations = () => {
    const areAnalyticsConfirmedAndEnabled = getAnalyticsConfirmedAndEnabled();

    return [
        captureConsoleIntegration({ levels: ['error'] }),
        /*
         Unless explicit analytics consent was persisted from before, don't start with tracing & profiling integrations.
         This means that after you accept analytics on your first session, tracing & profiling is still off until app is
         reloaded, but that's an acceptable cost – most important is to make sure nothing gets through rejected consent.
        */
        ...(areAnalyticsConfirmedAndEnabled
            ? [
                  browserProfilingIntegration(),
                  browserTracingIntegration(),
                  elementTimingIntegration(),
              ]
            : []),
    ] satisfies BrowserOptions['integrations'];
};
