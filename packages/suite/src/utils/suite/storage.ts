import { connectInitThunk } from '@suite-common/connect-init';
import { DeviceWithEmptyPath } from '@suite-common/suite-types';

import { hashCheckErrorScenarios, revisionCheckErrorScenarios } from 'src/constants/suite/firmware';
import { AcquiredDevice } from 'src/types/suite';
import { CoinjoinAccount } from 'src/types/wallet/coinjoin';

type AuthenticityChecks = AcquiredDevice['authenticityChecks'];
const filterInconclusiveAuthenticityChecks = (checks: AuthenticityChecks): AuthenticityChecks => {
    if (checks === undefined) return undefined;
    let { firmwareRevision, firmwareHash } = checks;
    if (
        firmwareRevision !== null &&
        !firmwareRevision.success &&
        revisionCheckErrorScenarios[firmwareRevision.error].isConclusive === false
    ) {
        firmwareRevision = null;
    }
    if (
        firmwareHash !== null &&
        !firmwareHash.success &&
        hashCheckErrorScenarios[firmwareHash.error].isConclusive === false
    ) {
        firmwareHash = null;
    }

    return { firmwareRevision, firmwareHash };
};

/**
 * Strip fields from Device
 * @param {AcquiredDevice} device
 */
export const serializeDevice = (
    device: AcquiredDevice,
    forceRemember?: true,
): DeviceWithEmptyPath => {
    const sd: DeviceWithEmptyPath = {
        ...device,
        path: '',
        remember: true,
        connected: false,
        buttonRequests: [],
        authenticityChecks: filterInconclusiveAuthenticityChecks(device.authenticityChecks),
    };
    if (forceRemember) sd.forceRemember = true;

    return sd;
};

/**
 * Serialize coinjoin account so that it is never saved with a session and transaction candidates.
 */
export const serializeCoinjoinAccount = (coinjoinAccount: CoinjoinAccount) => {
    const { session, transactionCandidates, ...propertiesToSave } = coinjoinAccount;

    return propertiesToSave;
};

/**
 * Discard @suite-common/connect-init/init actions, we don't care about it in this test
 * if store dispatched these actions.
 * @suite-common/connect-init/init/pending
 * @suite-common/connect-init/init/fulfilled
 * @suite-common/connect-init/init/rejected
 */
export const discardMockedConnectInitActions = (actions: any[]) =>
    actions.filter(
        action =>
            ![
                connectInitThunk.pending.type,
                connectInitThunk.fulfilled.type,
                connectInitThunk.rejected.type,
            ].includes(action.type),
    );
