import { Analytics, getRandomId } from '@trezor/analytics';

import type { SuiteAnalyticsEvent } from './types';
// Re-export shared analytics event type
import type { SuiteSharedAnalyticsEvent } from '../shared/types';
export { EventType as EventTypeShared } from '../shared/constants';

const analytics = new Analytics<SuiteAnalyticsEvent | SuiteSharedAnalyticsEvent>({
    version: process.env.VERSION!,
    app: 'suite',
    useQueue: true,
});

export { analytics, getRandomId };
export * from './definitions';
export * from './types';
export * from './constants';
