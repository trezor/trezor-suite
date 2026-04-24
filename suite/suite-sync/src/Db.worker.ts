/// <reference lib="webworker" />
declare const self: DedicatedWorkerGlobalScope;

// Vendored from @evolu/web/src/local-first/Db.worker.ts because @evolu/web's
// `exports` field doesn't expose this entry point. Imports are rewritten to
// the package's public surface. Remove together with createEvoluDepsFixed.ts
// once https://github.com/evoluhq/evolu/issues/670 is resolved.

import { createRandomBytes } from '@evolu/common';
import { startDbWorker } from '@evolu/common/local-first';
import { installPolyfills } from '@evolu/common/polyfills';
import {
    createLeaderLock,
    createRun,
    createWasmSqliteDriver,
    createWorkerDeps,
    createWorkerSelf,
} from '@evolu/web';

installPolyfills();

const run = createRun({
    ...createWorkerDeps(),
    createSqliteDriver: createWasmSqliteDriver,
    leaderLock: createLeaderLock(),
    randomBytes: createRandomBytes(),
});

run(startDbWorker(createWorkerSelf(self)));
