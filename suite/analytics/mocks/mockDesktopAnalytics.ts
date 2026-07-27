import type { Analytics } from '@trezor/analytics-uploader';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';

import type { AnalyticsDesktopEvents } from '../src/analyticsEvents';

export const mockDesktopAnalytics = (
    report?: Analytics<AnalyticsDesktopEvents>['report'],
): Analytics<AnalyticsDesktopEvents> => mockAnalytics<AnalyticsDesktopEvents>(report);
