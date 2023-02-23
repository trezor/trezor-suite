import { Analytics } from '@trezor/analytics';

import { AppAnalyticsEvent } from './events';

export const analytics = new Analytics<AppAnalyticsEvent>(process.env.VERSION!, 'mobile');
