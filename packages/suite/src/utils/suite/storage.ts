import { AcquiredDevice } from '@suite-types';
import { Discovery } from '@wallet-reducers/discoveryReducer';
import { connectInitThunk } from '@suite-common/connect-init';
import { CoinjoinAccount } from '@wallet-types/coinjoin';

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
 * Serialize coinjoin session so that it is always saved as paused to prevent it from automatically restoring when Suite starts.
 */
export const serializeCoinjoinSession = (coinjoinAccount: CoinjoinAccount) => {
    if (coinjoinAccount.session) {
        const { interrupted, roundPhase, sessionDeadline, starting, ...pausedSession } = {
            ...coinjoinAccount.session,
            paused: true,
            sessionPhaseQueue: [],
        };
        return { ...coinjoinAccount, session: pausedSession };
    }
    return coinjoinAccount;
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
