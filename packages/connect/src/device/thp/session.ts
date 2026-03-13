import { thp as protocolThp } from '@trezor/protocol';

import { thpCall } from './thpCall';
import type { IDevice } from '../../types/idevice';

export const createThpSession = async (device: IDevice, deriveCardano: boolean) => {
    let passphrase: protocolThp.ThpCreateNewSession;
    if (device.features.passphrase_protection === false) {
        passphrase = { passphrase: '' };
    } else {
        // same flow as DeviceCurrentSession PassphraseRequest
        passphrase = await device.prompt('passphrase', {}).then(promptRes => {
            if (!promptRes.success) {
                return { passphrase: '' };
            }

            return promptRes.payload.passphraseOnDevice
                ? { on_device: true }
                : { passphrase: promptRes.payload.value.normalize('NFKD') };
        });
    }

    await thpCall(device, 'ThpCreateNewSession', {
        ...passphrase,
        derive_cardano: deriveCardano,
    });

    return 0;
};
