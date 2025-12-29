import type { SuiteSharedLegacyAnalyticsEvents } from '@suite-common/analytics-types';
import { Analytics } from '@trezor/analytics';

import { SuiteDesktopLegacyAnalyticsEvents } from './types';

// @TODO: we have to type dispatch correctly in desktop/native/common
export const getTypedDesktopLegacyAnalytics = (
    legacyAnalytics: Analytics<SuiteSharedLegacyAnalyticsEvents>,
) => legacyAnalytics as unknown as Analytics<SuiteDesktopLegacyAnalyticsEvents>;
