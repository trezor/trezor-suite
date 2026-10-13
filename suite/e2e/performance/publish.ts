import { publishFromCi } from '@trezor/perf-e2e';

import { collectRuns } from './publishPerformance';

publishFromCi(collectRuns);
