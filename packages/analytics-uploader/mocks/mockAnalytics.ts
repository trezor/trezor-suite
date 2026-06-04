import type { Analytics, Event as AnalyticsEvent } from '../src';

export const mockAnalytics = <T extends AnalyticsEvent>(
    report: Analytics<T>['report'] = () => {},
): Analytics<T> => ({
    init: () => {},
    enable: () => {},
    disable: () => {},
    isEnabled: () => true,
    setUrl: () => {},
    setLoggerEnabled: () => {},
    report,
});
