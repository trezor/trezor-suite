import { AnalyticsSharedEvents } from '@suite-common/analytics-types';
import { Analytics } from '@trezor/analytics';

import { AnalyticsDesktopEvents } from './analyticsEvents';

// @TODO: we have to type dispatch correctly in desktop/native/common
export const getTypedDesktopAnalytics = (analytics: Analytics<AnalyticsSharedEvents>) =>
    analytics as unknown as Analytics<AnalyticsDesktopEvents>;
