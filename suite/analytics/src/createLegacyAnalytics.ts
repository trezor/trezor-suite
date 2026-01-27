import { Analytics, QueuedAnalytics } from '@trezor/analytics-uploader';

import { SuiteDesktopLegacyAnalyticsEvents } from './types';

export type DesktopLegacyAnalyticsDep = {
    legacyAnalytics: Analytics<SuiteDesktopLegacyAnalyticsEvents>;
};

/** @deprecated use `createAnalytics` instead */
export const createLegacyAnalytics = (): Analytics<SuiteDesktopLegacyAnalyticsEvents> =>
    new QueuedAnalytics<SuiteDesktopLegacyAnalyticsEvents>({
        version: process.env.VERSION!,
        app: 'suite',
        useQueue: true,
    });
