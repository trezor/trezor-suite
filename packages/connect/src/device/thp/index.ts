import { DEVICE } from '@trezor/connect-common/src/events/device';

import { createThpChannel, thpHandshake } from './handshake';
import { thpPairing } from './pairing';
import type { IDevice } from '../../types/idevice';

export { abortThpWorkflow } from './thpCall';
export { getThpCredentials } from './pairing';
export { createThpSession } from './session';

export const getThpChannel = async (device: IDevice, withInteraction?: boolean) => {
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
        const startPairing = thpState.phase === 'pairing' && withInteraction;
        if (startPairing) {
            device.emit(DEVICE.THP_PAIRING_STATUS_CHANGED, { status: 'started' });
            // start pairing with UI interaction
            await thpPairing(device);
        }

        if (thpState.phase !== 'paired') {
            device.emit(DEVICE.THP_PAIRING_STATUS_CHANGED, {
                status: 'failed',
                message: 'THP Locked',
            });

            return 'thp-locked';
        } else if (startPairing) {
            device.emit(DEVICE.THP_PAIRING_STATUS_CHANGED, { status: 'finished' });
        }
    } catch (error) {
        thpState.resetState();

        if (error.code === 'Device_ThpPairingTagInvalid') {
            // ignore. phase already changed to 'invalid-tag'
        } else if (error.code === 'Failure_ActionCancelled') {
            device.emit(DEVICE.THP_PAIRING_STATUS_CHANGED, { status: 'canceled' });
        } else {
            device.emit(DEVICE.THP_PAIRING_STATUS_CHANGED, {
                status: 'failed',
                message: error.message,
            });
        }

        throw error;
    }
};
