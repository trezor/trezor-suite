import { AcquiredDevice } from '@suite-types';
import { Discovery } from '@wallet-reducers/discoveryReducer';
import { init } from '@suite-actions/trezorConnectActions';

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
 * Discard @suite-common/connect-init/init actions, we don't care about it in this test
 * if store dispatched these actions.
 * @suite-common/connect-init/init/pending
 * @suite-common/connect-init/init/fulfilled
 * @suite-common/connect-init/init/rejected
 */
export const discardMockedConnectInitActions = (actions: any[]) =>
    actions.filter(
        action =>
            ![init.pending.type, init.fulfilled.type, init.rejected.type].includes(action.type),
    );
