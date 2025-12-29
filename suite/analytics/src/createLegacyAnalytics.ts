import { QueuedAnalytics } from '@trezor/analytics';

import { SuiteDesktopLegacyAnalyticsEvents } from './types';

export type DesktopLegacyAnalyticsDep = {
    legacyAnalytics: QueuedAnalytics<SuiteDesktopLegacyAnalyticsEvents>;
};

/** @deprecated use `createAnalytics` instead */
export const createLegacyAnalytics = (): QueuedAnalytics<SuiteDesktopLegacyAnalyticsEvents> =>
    new QueuedAnalytics<SuiteDesktopLegacyAnalyticsEvents>({
        version: process.env.VERSION!,
        app: 'suite',
        useQueue: true,
    });
