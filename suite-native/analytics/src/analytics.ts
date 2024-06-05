import { isDebugEnv } from '@suite-native/config';
import { getSuiteVersion } from '@trezor/env-utils';
import { Analytics, Event } from '@trezor/analytics';

import { SuiteNativeAnalyticsEvent } from './events';

export const analytics = new Analytics<SuiteNativeAnalyticsEvent>({
    version: getSuiteVersion(),
    app: 'suite',
});

if (isDebugEnv()) {
    // Do not send analytics in development
    analytics.report = (event: Event) => {
        if (process.env.EXPO_PUBLIC_IS_ANALYTICS_LOGGER_ENABLED === 'true') {
            // eslint-disable-next-line no-console
            console.log(`Analytics report '${event.type}':`, event);
        }
    };
}
