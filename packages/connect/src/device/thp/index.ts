import { ERRORS } from '../../constants';
import type { Device } from '../Device';

export const getThpChannel = async (_device: Device, _withInteraction?: boolean) => {
    // implementation...
    await new Promise((_, reject) => {
        reject(ERRORS.TypedError('Device_ThpStateMissing'));
    });
};
