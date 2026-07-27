import { type Analytics, QueuedAnalytics } from '@trezor/analytics-uploader';

import { type AnalyticsDesktopEvents } from './analyticsEvents';

export type DesktopAnalyticsDep = {
    analytics: Analytics<AnalyticsDesktopEvents>;
};

export const selectDesktopAnalyticsDep = (services: any): DesktopAnalyticsDep => ({
    analytics: services.analytics,
});

export const createAnalytics = (): Analytics<AnalyticsDesktopEvents> =>
    new QueuedAnalytics<AnalyticsDesktopEvents>({
        version: process.env.VERSION!,
        app: 'suite',
        useQueue: true,
    });
