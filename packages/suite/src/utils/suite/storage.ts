import { Discovery } from '@suite-common/wallet-types';
import { connectInitThunk } from '@suite-common/connect-init';

import { AcquiredDevice } from 'src/types/suite';
import { CoinjoinAccount } from 'src/types/wallet/coinjoin';

/**
 * Strip unserializable fields from Discovery (eg. promises)
 *
 * @param {Discovery} discovery
 */
export const serializeDiscovery = (discovery: Discovery) => ({ ...discovery, running: undefined });

/**
 * Strip fields from Device
 * @param {AcquiredDevice} device
 */
export const serializeDevice = (device: AcquiredDevice, forceRemember?: true) => {
    const sd = {
        ...device,
        path: '',
        remember: true,
        connected: false,
        buttonRequests: [],
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
