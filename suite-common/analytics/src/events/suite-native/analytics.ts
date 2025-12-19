import { Analytics } from '@trezor/analytics';
import { getSuiteVersion } from '@trezor/env-utils';

import { type SuiteNativeAnalyticsEvent } from './types';
import { SuiteSharedAnalyticsEvent } from '../shared/types';

/** @deprecated use `reportAnalytics` instead */
export const analytics = new Analytics<SuiteNativeAnalyticsEvent | SuiteSharedAnalyticsEvent>({
    version: getSuiteVersion(),
    app: 'suite',
});
