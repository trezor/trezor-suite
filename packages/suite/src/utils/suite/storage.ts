import { type CoinjoinAccount } from '@suite/coinjoin';
import { filterInconclusiveAuthenticityChecks } from '@suite-common/firmware-authenticity';
import { type DeviceWithEmptyPath } from '@suite-common/suite-types';

import { type AcquiredDevice } from 'src/types/suite';

/**
 * Strip fields from Device
 * @param {AcquiredDevice} device
 */
export const serializeDevice = (device: AcquiredDevice): DeviceWithEmptyPath => ({
    ...device,
    path: '',
    remember: true,
    connected: false,
    buttonRequests: [],
    authenticityChecks: filterInconclusiveAuthenticityChecks(device.authenticityChecks),
    // instead persisted on `persistentDeviceData` as part of the effort to unlink device from wallet
    thp: undefined,
});

/**
 * Serialize coinjoin account so that it is never saved with a session and transaction candidates.
 */
export const serializeCoinjoinAccount = (coinjoinAccount: CoinjoinAccount) => {
    const { session, transactionCandidates, ...propertiesToSave } = coinjoinAccount;

    return propertiesToSave;
};
