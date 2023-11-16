import { Analytics, getRandomId } from '@trezor/analytics';

import type { SuiteAnalyticsEvent } from './types/events';

const analytics = new Analytics<SuiteAnalyticsEvent>({
    version: process.env.VERSION!,
    app: 'suite',
    useQueue: true,
});

export { analytics, getRandomId };
export * from './types/definitions';
export * from './types/events';
export * from './constants';
