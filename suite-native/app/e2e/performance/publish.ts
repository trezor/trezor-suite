/* eslint-disable no-console */
import { publishPerformanceHistory } from './publishPerformance';

/**
 * CI entry point (`yarn workspace @suite-native/app perf:publish`). Never fails the job: the
 * history is a side effect of the run, not a gate on it.
 */
publishPerformanceHistory().catch((error: unknown) => {
    console.log(
        `[performance] Publishing failed: ${error instanceof Error ? error.message : String(error)}`,
    );
});
