import type { Analytics } from '../src/analytics';
import type { Event } from '../src/types';

/**
 * The event type is mandatory — always call it with an explicit generic
 * (e.g. `mockAnalytics<AnalyticsSharedEvents>()`) or use a typed wrapper such
 * as `mockNativeAnalytics` / `mockDesktopAnalytics`.
 */
export const mockAnalytics = <T extends Event = never>(
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
