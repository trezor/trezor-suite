import { Analytics, getRandomId } from '@trezor/analytics';

import { analytics as originalAnalytics } from './analytics';
import { SuiteSharedAnalyticsEvent } from './types';

// Cast type to SuiteSharedAnalyticsEvent
export const analytics = originalAnalytics as unknown as Analytics<SuiteSharedAnalyticsEvent>;
export { getRandomId };

export * from './types';
export * from './constants';
