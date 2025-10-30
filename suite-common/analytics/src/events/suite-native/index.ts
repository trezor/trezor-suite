import { Analytics, getRandomId } from '@trezor/analytics';
import { getSuiteVersion } from '@trezor/env-utils';

import type { SuiteNativeAnalyticsEvent } from './types';
import type { SuiteSharedAnalyticsEvent } from '../shared/types';
export { EventType as EventTypeShared } from '../shared/constants';

const analytics = new Analytics<SuiteNativeAnalyticsEvent | SuiteSharedAnalyticsEvent>({
    version: getSuiteVersion(),
    app: 'suite',
});

export { analytics, getRandomId };
export * from './definitions';
export * from './types';
export * from './constants';
