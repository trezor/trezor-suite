/**
 * Suite Sync stores data through Evolu, which relies on `SharedWorker` in the
 * browser. Chrome on Android does not expose `SharedWorker`, so Suite Sync
 * cannot run there and must be disabled both at composition and UI level.
 */
export const isSuiteSyncRuntimeAvailable = (): boolean =>
    typeof SharedWorker !== 'undefined';
