import { isDebugEnv } from '@suite-native/config';
import { getSuiteVersion } from '@trezor/env-utils';
import { Analytics } from '@trezor/analytics';

import { SuiteNativeAnalyticsEvent } from './events';

export const analytics = new Analytics<SuiteNativeAnalyticsEvent>({
    version: getSuiteVersion(),
    app: 'suite',
});

if (isDebugEnv()) {
    // Do not send analytics in development
    analytics.report = () => {};
}
