import { isDebugEnv } from '@suite-native/config';
import { Analytics, Event, QueuedAnalytics } from '@trezor/analytics-uploader';
import { getSuiteVersion } from '@trezor/env-utils';

import { AnalyticsNativeEvents } from './analyticsEvents';

export type NativeAnalyticsDep = {
    analytics: Analytics<AnalyticsNativeEvents>;
};

export const createAnalytics = (): Analytics<AnalyticsNativeEvents> => {
    const newAnalytics = new QueuedAnalytics<AnalyticsNativeEvents>({
        version: getSuiteVersion(),
        app: 'suite',
    });

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
