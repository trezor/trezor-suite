import type { Device } from '../Device';
import { createThpChannel, thpHandshake } from './handshake';
import { thpPairing } from './pairing';

export { abortThpWorkflow } from './thpCall';
export { getThpCredentials } from './pairing';
export { createThpSession } from './session';

export const getThpChannel = async (device: Device, withInteraction?: boolean) => {
    const thpState = device.getThpState();

    try {
        if (thpState?.phase === 'handshake') {
            await createThpChannel(device);
            try {
                await thpHandshake(device);
            } catch (error) {
                if (error.code === 'ThpDeviceLocked') {
                    // Device is pin-locked, retry handshake with tryToUnlock param
                    thpState.resetState();
                    await createThpChannel(device);
                    await thpHandshake(device, true);
                } else {
                    throw error;
                }
            }
        }
        if (thpState?.phase === 'pairing' && withInteraction) {
            // start pairing with UI interaction
            await thpPairing(device);
        }
    } catch (error) {
        thpState?.resetState();

        throw error;
    }
};
