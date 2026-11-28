import { upsertStickyPrComment } from '@trezor/e2e-utils';
import { publishFromCi } from '@trezor/perf-e2e';

import { collectRuns } from './publishPerformance';

publishFromCi(collectRuns, { upsertPrComment: upsertStickyPrComment });
