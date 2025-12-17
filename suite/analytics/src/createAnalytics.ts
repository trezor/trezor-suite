import { Analytics, QueuedAnalytics } from '@trezor/analytics';

import { AnalyticsDesktopEvents } from './analyticsEvents';

export type DesktopAnalyticsDep = {
    analytics: Analytics<AnalyticsDesktopEvents>;
};

export const createAnalytics = (): Analytics<AnalyticsDesktopEvents> =>
    new QueuedAnalytics<AnalyticsDesktopEvents>({
        version: process.env.VERSION!,
        app: 'suite',
        useQueue: true,
    });
