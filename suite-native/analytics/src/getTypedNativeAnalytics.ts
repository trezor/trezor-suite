import { AnalyticsSharedEvents } from '@suite-common/analytics-types';
import { Analytics } from '@trezor/analytics';

import { AnalyticsNativeEvents } from './analyticsEvents';

// @TODO: we have to type dispatch correctly in desktop/native/common
export const getTypedNativeAnalytics = (analytics: Analytics<AnalyticsSharedEvents>) =>
    analytics as unknown as Analytics<AnalyticsNativeEvents>;
