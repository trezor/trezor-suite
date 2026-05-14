import { type AnalyticsSharedEvents } from '@suite-common/analytics';
import { type Analytics } from '@trezor/analytics-uploader';

import { type AnalyticsNativeEvents } from './analyticsEvents';

// @TODO: we have to type dispatch correctly in desktop/native/common
export const asTypedNativeAnalytics = (analytics: Analytics<AnalyticsSharedEvents>) =>
    analytics as unknown as Analytics<AnalyticsNativeEvents>;
