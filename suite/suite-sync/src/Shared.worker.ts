/// <reference lib="webworker" />
declare const self: SharedWorkerGlobalScope;

// Vendored from @evolu/web/src/local-first/Shared.worker.ts because @evolu/web's
// `exports` field doesn't expose this entry point. Imports are rewritten to
// the package's public surface. Remove together with createEvoluDepsFixed.ts
// once https://github.com/evoluhq/evolu/issues/670 is resolved.

import { createWebSocket } from '@evolu/common';
import { initSharedWorker } from '@evolu/common/local-first';
import { installPolyfills } from '@evolu/common/polyfills';
import { createRun, createSharedWorkerSelf, createWorkerDeps } from '@evolu/web';

installPolyfills();

const run = createRun({
    ...createWorkerDeps(),
    createWebSocket,
});

run(initSharedWorker(createSharedWorkerSelf(self)));
