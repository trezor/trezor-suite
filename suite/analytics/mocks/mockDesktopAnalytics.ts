import type { Analytics } from '@trezor/analytics-uploader';
import { type MockedAnalytics, mockAnalytics } from '@trezor/analytics-uploader/mocks';

import type { AnalyticsDesktopEvents } from '../src/analyticsEvents';

export const mockDesktopAnalytics = (
    report?: jest.MockedFunction<Analytics<AnalyticsDesktopEvents>['report']>,
): MockedAnalytics<AnalyticsDesktopEvents> => mockAnalytics<AnalyticsDesktopEvents>(report);
