import { Analytics, getRandomId } from '@trezor/analytics';

import type { ConnectAnalyticsEvent } from './types/events';

const analytics = new Analytics<ConnectAnalyticsEvent>(process.env.VERSION!, 'connect');

export { analytics, getRandomId };
export * from './types/events';
export * from './constants';
