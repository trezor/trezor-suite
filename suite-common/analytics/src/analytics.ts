import { AnalyticsSharedEvents } from '@suite-common/analytics-types';
import { QueuedAnalytics } from '@trezor/analytics';
import { getSuiteVersion, isNative } from '@trezor/env-utils';

export const analytics = new QueuedAnalytics<AnalyticsSharedEvents>({
    app: 'suite',
    version: getSuiteVersion(),
    useQueue: !isNative(), // queue is not supported for @suite-native yet
});
