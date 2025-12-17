import { Event, getRandomId } from '@trezor/analytics';

import { newAnalytics as newAnalyticsRenamed } from './reportAnalytics';

export { EventType as EventTypeShared } from '../shared/constants';
export { reportAnalytics, analytics } from './reportAnalytics';

// Inlined to avoid native dependency
const isDebugEnv = () => process.env.EXPO_PUBLIC_ENVIRONMENT === 'debug';
const newAnalytics = newAnalyticsRenamed;

if (isDebugEnv()) {
    // Do not send analytics in development
    newAnalytics.report = (event: Event) => {
        if (process.env.EXPO_PUBLIC_IS_ANALYTICS_LOGGER_ENABLED === 'true') {
            // eslint-disable-next-line no-console
            console.log(`Analytics report '${event.type}':`, event);
        }
    };
}
export { getRandomId, newAnalytics };
export * from './definitions';
export * from './types';
export * from './constants';
