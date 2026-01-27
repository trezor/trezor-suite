import { Analytics } from '@trezor/analytics-uploader';

import { SuiteDesktopLegacyAnalyticsEvents } from './types';

// @TODO: we have to type dispatch correctly in desktop/native/common
export const getTypedDesktopLegacyAnalytics = (legacyAnalytics: Analytics<any>) =>
    legacyAnalytics as unknown as Analytics<SuiteDesktopLegacyAnalyticsEvents>;
