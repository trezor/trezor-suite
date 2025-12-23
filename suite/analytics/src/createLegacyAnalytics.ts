import { SuiteSharedAnalyticsEvent } from '@suite-common/analytics';
import { Analytics } from '@trezor/analytics';

import { SuiteAnalyticsEvent } from './types';

/** @deprecated use `createAnalytics` instead */
export const createLegacyAnalytics = (): Analytics<
    SuiteAnalyticsEvent | SuiteSharedAnalyticsEvent
> =>
    new Analytics<SuiteAnalyticsEvent | SuiteSharedAnalyticsEvent>({
        version: process.env.VERSION!,
        app: 'suite',
        useQueue: true,
    });
