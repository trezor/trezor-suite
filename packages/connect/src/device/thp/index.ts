import type { Device } from '../Device';
import { createThpChannel, thpHandshake } from './handshake';
import { thpPairing } from './pairing';

export { abortThpWorkflow } from './thpCall';
export { getThpCredentials } from './pairing';
export { createThpSession } from './session';

export const getThpChannel = async (device: Device, withInteraction?: boolean) => {
    const thpState = device.getThpState();
    console.log('GET THP CHANNEL -------------------');
    try {
        if (thpState?.phase === 'handshake') {
            await createThpChannel(device);
            console.log('THP CHANNEL CREATED -------------------');
            await thpHandshake(device);
            console.log('THP HANDSHAKE DONE -------------------');
        }
        if (thpState?.phase === 'pairing' && withInteraction) {
            // start pairing with UI interaction
            await thpPairing(device);
            console.log('THP PAIRING DONE -------------------');
        }
    } catch (error) {
        console.log('======= getthpchannel error, resetting state =======', error);
        thpState?.resetState();

        if (error.message.includes('ThpTransportBusy')) {
            return getThpChannel(device, withInteraction);
        }

        throw error;
    }
};
