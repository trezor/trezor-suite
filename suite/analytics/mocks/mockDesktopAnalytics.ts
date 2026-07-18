import { mockAnalytics } from '@trezor/analytics-uploader/mocks';

import type { DesktopAnalytics } from '../src/createAnalytics';

export const mockDesktopAnalytics = (report?: DesktopAnalytics['report']): DesktopAnalytics =>
    mockAnalytics(report);
