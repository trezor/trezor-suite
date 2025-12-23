import { Analytics, Event } from '@trezor/analytics';
import { getSuiteVersion } from '@trezor/env-utils';

import { AnalyticsNativeEvents } from './analyticsEvents';

export type NativeAnalyticsDep = {
    analytics: Analytics<AnalyticsNativeEvents>;
};

export const createAnalytics = (): Analytics<AnalyticsNativeEvents> => {
    const newAnalytics = new Analytics<AnalyticsNativeEvents>({
        version: getSuiteVersion(),
        app: 'suite',
    });

    // Inlined to avoid native dependency
    const isDebugEnv = () => process.env.EXPO_PUBLIC_ENVIRONMENT === 'debug';

    if (isDebugEnv()) {
        // Do not send analytics in development
        newAnalytics.report = (event: Event) => {
            if (process.env.EXPO_PUBLIC_IS_ANALYTICS_LOGGER_ENABLED === 'true') {
                // eslint-disable-next-line no-console
                console.log(`Analytics report '${event.type}':`, event);
            }
        };
    }

    return newAnalytics;
};
