import { Analytics } from '@trezor/analytics';

import { SuiteAnalyticsEvent } from './types';
import { SuiteSharedAnalyticsEvent } from '../shared/types';

/** @deprecated use `reportAnalytics` instead */
export const analytics = new Analytics<SuiteAnalyticsEvent | SuiteSharedAnalyticsEvent>({
    version: process.env.VERSION!,
    app: 'suite',
    useQueue: true,
});
