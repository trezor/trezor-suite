import { type Analytics, QueuedAnalytics } from '@trezor/analytics-uploader';

import { type AnalyticsDesktopEvents } from './analyticsEvents';

export type DesktopAnalytics = Analytics<AnalyticsDesktopEvents>;

export type DesktopAnalyticsDep = {
    analytics: DesktopAnalytics;
};

export const selectDesktopAnalyticsDep = (services: any): DesktopAnalyticsDep => ({
    analytics: services.analytics,
});

export const createAnalytics = (): DesktopAnalytics =>
    new QueuedAnalytics<AnalyticsDesktopEvents>({
        version: process.env.VERSION!,
        app: 'suite',
        useQueue: true,
    });
