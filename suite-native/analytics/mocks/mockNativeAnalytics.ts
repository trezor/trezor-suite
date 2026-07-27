import type { Analytics } from '@trezor/analytics-uploader';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';

import type { AnalyticsNativeEvents } from '../src/analyticsEvents';

export const mockNativeAnalytics = (
    report?: Analytics<AnalyticsNativeEvents>['report'],
): Analytics<AnalyticsNativeEvents> => mockAnalytics<AnalyticsNativeEvents>(report);
