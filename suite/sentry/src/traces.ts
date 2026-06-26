import type { BrowserOptions } from '@sentry/browser';

import { isCodesignBuild } from '@trezor/env-utils';

const isProd = isCodesignBuild();
const DEFAULT_TRACES_SAMPLE_RATE = isProd ? 0.1 : 1;

const STORAGE_KEY = 'analytics-confirmed-and-enabled';

/**
 * Persist the analytics confirmed & enabled decision also in localStorage, because in order to use it for traces filtering, it must be readable synchronously.
 * That's because Sentry.init() starts synchronously right away when module is loaded, but IDB is retrieved async much later (preloadStore when react app renders).
 * Note that this is different from `redactSentryEvent`, because error events are a discrete events. There we don't mind
 * that the confirmed & enabled decision may not yet be available for error events sent early before IDB loads,
 * because those events are merely sent redacted, that's OK. While traces are continuously running from Sentry.init(),
 * and if we don't have the decision available at that point, we have to drop them entirely, so it would not be possible to collect them.
 *
 * Known issue: the first fresh app load will not emit trace, that is due to design (need to confirm analytics first).
 */
export const setShouldCaptureBrowserTracing = (newValue: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(newValue));
};

export const getShouldCaptureBrowserTracing = (): boolean =>
    localStorage.getItem(STORAGE_KEY) === 'true';

/**
 * Drop Sentry tracing & profiling when analytics are not explicitly enabled, by dynamically setting the sample rate.
 * As per Sentry docs, that is the recommended way for arbitrary traces filtering.
 */
export const tracesSampler: NonNullable<BrowserOptions['tracesSampler']> = samplingContext => {
    const shouldCaptureBrowserTracing = getShouldCaptureBrowserTracing();
    if (shouldCaptureBrowserTracing !== true) return 0;

    return samplingContext.inheritOrSampleWith(DEFAULT_TRACES_SAMPLE_RATE);
};
