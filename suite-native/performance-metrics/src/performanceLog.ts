import { isDetoxTestBuild } from '@suite-native/config';

import { PERFORMANCE_LOG_PREFIX } from './constants';
import { type PerformanceSample } from './types';

export const formatPerformanceLogLine = (sample: PerformanceSample) =>
    `${PERFORMANCE_LOG_PREFIX} ${JSON.stringify(sample)}`;

export const logPerformanceSample = (sample: PerformanceSample) => {
    if (!isDetoxTestBuild()) return;

    // The device log is the only app-to-test channel Detox gives us, so the sample is written as
    // a single parsable line instead of being reported through a logger.
    // eslint-disable-next-line no-console
    console.log(formatPerformanceLogLine(sample));
};
