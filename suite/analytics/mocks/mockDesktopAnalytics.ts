import { type MockedAnalytics, mockAnalytics } from '@trezor/analytics-uploader/mocks';

import type { AnalyticsDesktopEvents } from '../src/analyticsEvents';
import type { DesktopAnalytics } from '../src/createAnalytics';

export const mockDesktopAnalytics = (
    report?: jest.MockedFunction<DesktopAnalytics['report']>,
): MockedAnalytics<AnalyticsDesktopEvents> => mockAnalytics(report);
