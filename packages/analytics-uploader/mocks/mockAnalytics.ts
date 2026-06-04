import type { Analytics } from '../src/analytics';
import { Event } from '../src/types';

export const mockAnalytics = <T extends Event>(
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
