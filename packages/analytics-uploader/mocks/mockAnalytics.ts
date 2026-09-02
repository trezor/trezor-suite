import type { Analytics } from '../src/analytics';
import type { Event } from '../src/types';

/** `report` is a spy, so a test asserts on it through the mock it was given. */
export type MockedAnalytics<T extends Event> = Analytics<T> & {
    report: jest.MockedFunction<Analytics<T>['report']>;
};

/**
 * The event type is mandatory — always call it with an explicit generic
 * (e.g. `mockAnalytics<AnalyticsSharedEvents>()`) or use a typed wrapper such
 * as `mockNativeAnalytics` / `mockDesktopAnalytics`.
 */
export const mockAnalytics = <T extends Event = never>(
    report: jest.MockedFunction<Analytics<T>['report']> = jest.fn(),
): MockedAnalytics<T> => ({
    init: () => {},
    enable: () => {},
    disable: () => {},
    isEnabled: () => true,
    setUrl: () => {},
    setLoggerEnabled: () => {},
    report,
});
