import { type TrezorDevice } from '@suite-common/suite-types';

import { type AttributeDef } from './eventDefinition';

export type EarnDeviceStatus = 'connected' | 'disconnected' | 'pin' | 'passphrase' | 'unavailable';

type AuthorizationRequests = {
    isPinRequested?: boolean;
    isPassphraseRequested?: boolean;
};

export const getEarnDeviceStatus = (
    device: TrezorDevice | undefined,
    { isPinRequested, isPassphraseRequested }: AuthorizationRequests = {},
): EarnDeviceStatus => {
    if (!device?.connected) return 'disconnected';

    if (
        isPinRequested ||
        device.status === 'pin-locked' ||
        (device.features?.pin_protection && device.features.unlocked === false)
    ) {
        return 'pin';
    }

    if (isPassphraseRequested) return 'passphrase';

    if (
        device.available === false ||
        device.type === 'unacquired' ||
        device.type === 'unreadable' ||
        device.status === 'busy' ||
        device.status === 'occupied' ||
        device.status === 'thp-locked' ||
        device.status === 'rebooting' ||
        device.status === 'hard-locked' ||
        device.status === 'bootloader-locked'
    ) {
        return 'unavailable';
    }

    return 'connected';
};

export const deviceStatusAttribute = {
    description:
        'Selected Trezor status at the transaction-submit continue click, before the connection guard. Priority: disconnected (including no selected device), pin (known PIN lock or request), passphrase (active request), unavailable (connected but unusable), connected (no known blocker). Passphrase protection alone is not a pending request; connected does not guarantee signing readiness. Blocked and repeated attempts are reported. Omitted on education, skips, simulation decisions and outcomes. Later authorization requests do not change this snapshot. Contains only this fixed status, never device identifiers or authentication values.',
    changelog: [{ version: '26.11.0', notes: 'added for Desktop and Mobile Earn submit attempts' }],
} satisfies AttributeDef<EarnDeviceStatus>;
