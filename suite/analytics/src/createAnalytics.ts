import { Analytics } from '@trezor/analytics';

import { AnalyticsDesktopEvents } from './analyticsEvents';

export const createAnalytics = (): Analytics<AnalyticsDesktopEvents> =>
    new Analytics<AnalyticsDesktopEvents>({
        version: process.env.VERSION!,
        app: 'suite',
        useQueue: true,
    });
