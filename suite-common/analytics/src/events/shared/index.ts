import { Analytics, getRandomId } from '@trezor/analytics';

import { analytics as originalAnalytics, reportAnalytics } from './analytics';
import { SuiteSharedAnalyticsEvent } from './types';

// Cast type to SuiteSharedAnalyticsEvent
export const analytics = originalAnalytics as unknown as Analytics<SuiteSharedAnalyticsEvent>;
export { getRandomId, reportAnalytics };

export * from './constants';
