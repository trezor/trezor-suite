import { ThpSettings } from '../../types';
import type { Device } from '../Device';
import { createThpChannel, thpHandshake } from './handshake';
import { thpPairing } from './pairing';

export { abortThpWorkflow } from './thpCall';
export { getThpCredentials } from './pairing';
export { createThpSession } from './session';

export const getThpChannel = async (
    device: Device,
    settings?: ThpSettings,
    withInteraction?: boolean,
) => {
    const thpState = device.getThpState();

    try {
        if (thpState?.phase === 'handshake') {
            await createThpChannel(device, settings);
            await thpHandshake(device, settings);
        }
        if (thpState?.phase === 'pairing' && withInteraction) {
            // start pairing with UI interaction
            await thpPairing(device, settings!);
        }
    } catch (error) {
        thpState?.resetState();

        throw error;
    }
};
