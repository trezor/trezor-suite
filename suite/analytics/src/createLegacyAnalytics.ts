import { Analytics } from '@trezor/analytics';

import { SuiteDesktopLegacyAnalyticsEvents } from './types';

export type DesktopLegacyAnalyticsDep = {
    legacyAnalytics: Analytics<SuiteDesktopLegacyAnalyticsEvents>;
};

/** @deprecated use `createAnalytics` instead */
export const createLegacyAnalytics = (): Analytics<SuiteDesktopLegacyAnalyticsEvents> =>
    new Analytics<SuiteDesktopLegacyAnalyticsEvents>({
        version: process.env.VERSION!,
        app: 'suite',
        useQueue: true,
    });
