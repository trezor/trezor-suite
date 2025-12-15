import type { Analytics } from '@trezor/analytics';
import { getRandomId } from '@trezor/analytics';

import { analytics as originalAnalytics } from './analytics';
import type { SuiteSharedAnalyticsEvent } from './types';

// Cast type to SuiteSharedAnalyticsEvent
export const analytics = originalAnalytics as unknown as Analytics<SuiteSharedAnalyticsEvent>;
export { getRandomId };

export type * from './types';
export * from './constants';
