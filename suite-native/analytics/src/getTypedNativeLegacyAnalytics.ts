import { Analytics } from '@trezor/analytics';

import { SuiteNativeLegacyAnalyticsEvents } from './types';

// @TODO: we have to type dispatch correctly in desktop/native/common
export const getTypedNativeLegacyAnalytics = (legacyAnalytics: Analytics<any>) =>
    legacyAnalytics as unknown as Analytics<SuiteNativeLegacyAnalyticsEvents>;
