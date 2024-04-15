import type { Device } from '../Device';
import { createThpChannel, thpHandshake } from './handshake';
import { thpPairing } from './pairing';

export { abortThpWorkflow } from './thpCall';
export { getThpCredentials } from './pairing';

export const getThpChannel = async (device: Device, withInteraction?: boolean) => {
    const thpState = device.getThpState();

    try {
        if (thpState?.phase === 'handshake') {
            await createThpChannel(device);
            await thpHandshake(device);
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
