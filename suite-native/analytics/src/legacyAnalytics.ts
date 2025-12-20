import { SuiteSharedAnalyticsEvent } from '@suite-common/analytics';
import { Analytics } from '@trezor/analytics';
import { getSuiteVersion } from '@trezor/env-utils';

import { SuiteNativeAnalyticsEvent } from './types';

/** @deprecated use `reportAnalytics` instead */
export const analytics = new Analytics<SuiteNativeAnalyticsEvent | SuiteSharedAnalyticsEvent>({
    version: getSuiteVersion(),
    app: 'suite',
});

// // Inlined to avoid native dependency
// const isDebugEnv = () => process.env.EXPO_PUBLIC_ENVIRONMENT === 'debug';

// // TODO FIX!
// if (isDebugEnv()) {
//     // Do not send analytics in development
//     analytics.report = (event: Event) => {
//         if (process.env.EXPO_PUBLIC_IS_ANALYTICS_LOGGER_ENABLED === 'true') {
//             // eslint-disable-next-line no-console
//             console.log(`Analytics report '${event.type}':`, event);
//         }
//     };
// }
