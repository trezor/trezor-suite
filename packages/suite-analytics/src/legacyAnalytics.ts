import { SuiteSharedAnalyticsEvent } from '@suite-common/analytics';
import { Analytics } from '@trezor/analytics';

import { SuiteAnalyticsEvent } from './types';

/** @deprecated use `reportAnalytics` instead */
export const analytics = new Analytics<SuiteAnalyticsEvent | SuiteSharedAnalyticsEvent>({
    version: process.env.VERSION!,
    app: 'suite',
    useQueue: true,
});
