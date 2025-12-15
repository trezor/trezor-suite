import { Analytics, getRandomId } from '@trezor/analytics';

import type { ConnectAnalyticsEvent } from './types/events';

const analytics = new Analytics<ConnectAnalyticsEvent>({
    version: process.env.VERSION!,
    app: 'connect',
    useQueue: true,
});

export { analytics, getRandomId };
export type * from './types/events';
export * from './constants';
