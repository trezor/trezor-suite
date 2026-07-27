import { type AnalyticsSharedEvents } from '@suite-common/analytics';
import { type Analytics } from '@trezor/analytics-uploader';

import { type AnalyticsDesktopEvents } from './analyticsEvents';

// @TODO: we have to type dispatch correctly in desktop/native/common
export const asTypedDesktopAnalytics = (analytics: Analytics<AnalyticsSharedEvents>) =>
    analytics as unknown as Analytics<AnalyticsDesktopEvents>;
