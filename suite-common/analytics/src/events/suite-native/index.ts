import { Analytics, Event, getRandomId } from '@trezor/analytics';
import { getSuiteVersion } from '@trezor/env-utils';

import type { SuiteNativeAnalyticsEvent } from './types';
import type { SuiteSharedAnalyticsEvent } from '../shared/types';
export { EventType as EventTypeShared } from '../shared/constants';

const analytics = new Analytics<SuiteNativeAnalyticsEvent | SuiteSharedAnalyticsEvent>({
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

export { analytics, getRandomId };
export * from './definitions';
export * from './types';
export * from './constants';
