import { AnalyticsSharedEvents } from '@suite-common/analytics';
import { Analytics } from '@trezor/analytics-uploader';

import { AnalyticsDesktopEvents } from './analyticsEvents';

// @TODO: we have to type dispatch correctly in desktop/native/common
export const getTypedDesktopAnalytics = (analytics: Analytics<AnalyticsSharedEvents>) =>
    analytics as unknown as Analytics<AnalyticsDesktopEvents>;
