import { AcquiredDevice } from '@suite-types';
import { Discovery } from '@wallet-reducers/discoveryReducer';

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
