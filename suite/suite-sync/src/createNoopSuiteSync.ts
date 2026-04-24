import { type SuiteSync } from '@suite-common/suite-sync-types';
import { err } from '@trezor/type-utils';

/**
 * Noop Suite Sync implementation returned when the runtime does not support
 * the dependencies Suite Sync requires (typically `SharedWorker`, which is
 * missing in Chrome on Android). The UI should prevent Suite Sync from being
 * enabled in this situation; these methods exist only as a safety net so that
 * accidental calls do not crash the app.
 */
export const createNoopSuiteSync = (): SuiteSync => {
    const unavailable = () =>
        Promise.resolve(err({ type: 'SuiteSyncUnavailableOnDeviceError' } as const));

    return {
        changeRelayUrl: () => Promise.resolve(),
        turnOnSuiteSync: unavailable,
        turnOffSuiteSync: () => Promise.resolve(),
        ensureWalletSuiteSyncOn: unavailable,
        turnOffSuiteSyncForWallet: () => Promise.resolve(),
        dangerouslyWipeAllLabelsFromWallet: unavailable,
        labeling: {
            updateWalletLabel: unavailable,
            updateAccountLabel: unavailable,
            updateAddressLabel: unavailable,
            updateOutputLabel: unavailable,
        },
    };
};
