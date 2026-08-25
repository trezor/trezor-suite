import type { Analytics } from '@trezor/analytics-uploader';
import { type MockedAnalytics, mockAnalytics } from '@trezor/analytics-uploader/mocks';

import type { AnalyticsNativeEvents } from '../src/analyticsEvents';

export const mockNativeAnalytics = (
    report?: jest.MockedFunction<Analytics<AnalyticsNativeEvents>['report']>,
): MockedAnalytics<AnalyticsNativeEvents> => mockAnalytics<AnalyticsNativeEvents>(report);
