import { QueuedAnalytics } from '@trezor/analytics';

import { AnalyticsDesktopEvents } from './analyticsEvents';

export type DesktopAnalyticsDep = {
    analytics: QueuedAnalytics<AnalyticsDesktopEvents>;
};

export const createAnalytics = (): QueuedAnalytics<AnalyticsDesktopEvents> =>
    new QueuedAnalytics<AnalyticsDesktopEvents>({
        version: process.env.VERSION!,
        app: 'suite',
        useQueue: true,
    });
