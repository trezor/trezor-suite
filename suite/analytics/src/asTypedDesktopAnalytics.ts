import { type AnalyticsSharedEvents } from '@suite-common/analytics';
import { type Analytics } from '@trezor/analytics-uploader';

import { type DesktopAnalytics } from './createAnalytics';

// @TODO: we have to type dispatch correctly in desktop/native/common
export const asTypedDesktopAnalytics = (analytics: Analytics<AnalyticsSharedEvents>) =>
    analytics as unknown as DesktopAnalytics;
