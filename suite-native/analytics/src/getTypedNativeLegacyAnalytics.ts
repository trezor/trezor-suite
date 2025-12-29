import { SuiteSharedLegacyAnalyticsEvents } from '@suite-common/analytics-types';
import { Analytics } from '@trezor/analytics';

import { SuiteNativeLegacyAnalyticsEvents } from './types';

// @TODO: we have to type dispatch correctly in desktop/native/common
export const getTypedNativeLegacyAnalytics = (
    legacyAnalytics: Analytics<SuiteSharedLegacyAnalyticsEvents>,
) => legacyAnalytics as unknown as Analytics<SuiteNativeLegacyAnalyticsEvents>;
