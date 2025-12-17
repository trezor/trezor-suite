import { Analytics } from '@trezor/analytics';
import { getSuiteVersion } from '@trezor/env-utils';

import {
    AnalyticsMobileEvent,
    AnalyticsSharedEvent,
    AnyMobileEventDef,
    AnySharedEventDef,
} from '../analyticsEvents';
import { type SuiteNativeAnalyticsEvent } from './types';
import { createReportAnalytics } from '../createReportAnalytics';
import { SuiteSharedAnalyticsEvent } from '../shared/types';

/** @deprecated use `reportAnalytics` instead */
export const analytics = new Analytics<SuiteNativeAnalyticsEvent | SuiteSharedAnalyticsEvent>({
    version: getSuiteVersion(),
    app: 'suite',
});

const newAnalytics = new Analytics<AnalyticsMobileEvent | AnalyticsSharedEvent>({
    version: getSuiteVersion(),
    app: 'suite',
});

export const reportAnalytics = createReportAnalytics<
    AnyMobileEventDef | AnySharedEventDef,
    AnalyticsMobileEvent | AnalyticsSharedEvent
>(newAnalytics);
