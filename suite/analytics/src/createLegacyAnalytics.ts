import { Analytics } from '@trezor/analytics';

import { SuiteAnalyticsEvent } from './types';

export type DesktopLegacyAnalyticsDep = {
    legacyAnalytics: Analytics<SuiteAnalyticsEvent>;
};

/** @deprecated use `createAnalytics` instead */
export const createLegacyAnalytics = (): Analytics<SuiteAnalyticsEvent> =>
    new Analytics<SuiteAnalyticsEvent>({
        version: process.env.VERSION!,
        app: 'suite',
        useQueue: true,
    });
