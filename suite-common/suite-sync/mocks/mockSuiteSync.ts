import { type SuiteSync } from '@suite-common/suite-sync-types';
import { err, ok } from '@trezor/type-utils';

export const mockSuiteSync = (): SuiteSync => ({
    changeRelayUrl: () => Promise.resolve(),
    disconnectAllRelays: () => Promise.resolve(),
    reconnectAllRelays: () => Promise.resolve(),
    ensureWalletSuiteSyncOn: () =>
        Promise.resolve(err({ type: 'SuiteSyncUnavailableOnDeviceError' })),
    ensureWalletSuiteSyncOnUncontrolled: () => Promise.resolve(),
    turnOffSuiteSyncForWallet: () => Promise.resolve(),
    turnOnSuiteSync: () => Promise.resolve(ok()),
    turnOffSuiteSync: () => Promise.resolve(),
    dangerouslyWipeAllLabelsFromWallet: () => Promise.resolve(ok()),
    labeling: {
        updateAccountLabel: () => Promise.resolve(ok()),
        updateAddressLabel: () => Promise.resolve(ok()),
        updateOutputLabel: () => Promise.resolve(ok()),
        updateWalletLabel: () => Promise.resolve(ok()),
    },
});
