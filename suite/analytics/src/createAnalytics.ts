import { type Analytics, type Event, QueuedAnalytics } from '@trezor/analytics-uploader';

import { type AnalyticsDesktopEvents } from './analyticsEvents';

export type DesktopAnalytics = Analytics<AnalyticsDesktopEvents>;

export type DesktopAnalyticsDep = {
    analytics: DesktopAnalytics;
};

export const selectDesktopAnalyticsDep = (services: any): DesktopAnalyticsDep => ({
    analytics: services.analytics,
});

export const createAnalytics = (): DesktopAnalytics => {
    const analytics = new QueuedAnalytics<Event>({
        version: process.env.VERSION!,
        app: 'suite',
        useQueue: true,
    });

    // Prevents TypeScript from relating the exhaustive desktop event union to the base uploader event.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    return analytics as unknown as DesktopAnalytics;
};
