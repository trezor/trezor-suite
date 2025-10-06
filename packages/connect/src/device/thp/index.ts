import { DEVICE } from '../../events/device';
import type { Device } from '../Device';
import { createThpChannel, thpHandshake } from './handshake';
import { thpPairing } from './pairing';

export { abortThpWorkflow } from './thpCall';
export { getThpCredentials } from './pairing';
export { createThpSession } from './session';

export const getThpChannel = async (device: Device, withInteraction?: boolean) => {
    const thpState = device.getThpState();

    if (!thpState) return;

    try {
        if (thpState.phase === 'handshake') {
            await createThpChannel(device);
            try {
                await thpHandshake(device);
            } catch (error) {
                const isPinLocked = error.code === 'ThpDeviceLocked';
                const isTransportBusy = error.message === 'ThpTransportBusy';

                if (!isPinLocked && !isTransportBusy) throw error;

                thpState.resetState();

                if (isPinLocked && !withInteraction) return 'pin-locked';

                if (isPinLocked) {
                    // Device is pin-locked and interactions enabled, retry handshake with tryToUnlock param
                    device.emit(DEVICE.BUTTON, {
                        device,
                        payload: { code: 'ButtonRequest_PinEntry' },
                    });
                }

                await createThpChannel(device);
                await thpHandshake(device, isPinLocked);
            }
        }
        if (thpState.phase === 'pairing' && withInteraction) {
            // start pairing with UI interaction
            await thpPairing(device);
        }

        if (thpState.phase !== 'paired') {
            return 'thp-locked';
        }
    } catch (error) {
        thpState.resetState();

        throw error;
    }
};
