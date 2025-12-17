import {
    AnalyticsDesktopEvent,
    AnalyticsSharedEvent,
    AnyDesktopEventDef,
    AnySharedEventDef,
} from './analyticsEvents';
import { createReportAnalytics } from '@suite-common/analytics';
import { Analytics } from '@trezor/analytics';

const newAnalytics = new Analytics<AnalyticsDesktopEvent | AnalyticsSharedEvent>({
    version: process.env.VERSION!,
    app: 'suite',
    useQueue: true,
});

export const reportAnalytics = createReportAnalytics<
    AnyDesktopEventDef | AnySharedEventDef,
    AnalyticsDesktopEvent | AnalyticsSharedEvent
>(newAnalytics);
