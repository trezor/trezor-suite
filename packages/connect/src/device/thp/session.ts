import { thp as protocolThp } from '@trezor/protocol';

import type { Device } from '../Device';
import { thpCall } from './thpCall';

export const createThpSession = async (device: Device, deriveCardano: boolean) => {
    let passphrase: protocolThp.ThpCreateNewSession;
    if (!device.features.passphrase_protection) {
        passphrase = { passphrase: '' };
    } else {
        // same flow as DeviceCurrentSession PassphraseRequest
        passphrase = await device.prompt('passphrase', {}).then(promptRes => {
            if (!promptRes.success) {
                return { passphrase: '' };
            }

            return promptRes.payload.passphraseOnDevice
                ? { on_device: true }
                : { passphrase: promptRes.payload.value };
        });
    }

    await thpCall(device, 'ThpCreateNewSession', {
        ...passphrase,
        derive_cardano: deriveCardano,
    });

    return 0;
};
