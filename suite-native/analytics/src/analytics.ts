import { analytics as commonAnalytics } from '@suite-common/analytics';
import { isDebugEnv } from '@suite-native/config';
import { Event, QueuedAnalytics } from '@trezor/analytics';

import { AnalyticsNativeEvents } from './analyticsEvents';

export const analytics = commonAnalytics as QueuedAnalytics<AnalyticsNativeEvents>;

if (isDebugEnv()) {
    // Do not send analytics in development
    analytics.report = (event: Event) => {
        if (process.env.EXPO_PUBLIC_IS_ANALYTICS_LOGGER_ENABLED === 'true') {
            // eslint-disable-next-line no-console
            console.log(`Analytics report '${event.type}':`, event);
        }
    };
}
