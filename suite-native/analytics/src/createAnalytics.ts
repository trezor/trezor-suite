import { type Analytics, QueuedAnalytics } from '@trezor/analytics-uploader';
import { getSuiteVersion } from '@trezor/env-utils';

import { type AnalyticsNativeEvents } from './analyticsEvents';

export type NativeAnalyticsDep = {
    analytics: Analytics<AnalyticsNativeEvents>;
};

const createAnalytics = (): Analytics<AnalyticsNativeEvents> => {
    const newAnalytics = new QueuedAnalytics<AnalyticsNativeEvents>({
        version: getSuiteVersion(),
        app: 'suite',
    });

    return newAnalytics;
};

export const analytics = createAnalytics();
