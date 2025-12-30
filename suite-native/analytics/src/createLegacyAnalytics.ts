import { Analytics, QueuedAnalytics, Event } from '@trezor/analytics';
import { getSuiteVersion } from '@trezor/env-utils';

import { SuiteNativeLegacyAnalyticsEvents } from './types';

/** @deprecated */
export type NativeLegacyAnalyticsDep = {
    legacyAnalytics: Analytics<SuiteNativeLegacyAnalyticsEvents>;
};

/** @deprecated use `createAnalytics` instead */
export const createLegacyAnalytics = (): Analytics<SuiteNativeLegacyAnalyticsEvents> => {
    const analytics = new QueuedAnalytics<SuiteNativeLegacyAnalyticsEvents>({
        version: getSuiteVersion(),
        app: 'suite',
    });

    // Inlined to avoid native dependency
    const isDebugEnv = () => process.env.EXPO_PUBLIC_ENVIRONMENT === 'debug';

    if (isDebugEnv()) {
        // Do not send analytics in development
        analytics.report = (event: Event) => {
            if (process.env.EXPO_PUBLIC_IS_ANALYTICS_LOGGER_ENABLED === 'true') {
                // eslint-disable-next-line no-console
                console.log(`Analytics report '${event.type}':`, event);
            }
        };
    }

    return analytics;
};
