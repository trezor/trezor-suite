import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type FirmwareType } from '@trezor/connect';

import { EventType } from '../constants';
import { type FirmwareUpdateLocation, type FirmwareUpdateStartType } from '../definitions';

type Attributes = {
    model: AttributeDef<string>;
    fromBootloaderVersion: AttributeDef<string>;
    fromFwVersion: AttributeDef<string>;
    toFwVersion: AttributeDef<string>;
    fromFwType: AttributeDef<FirmwareType | 'none'>;
    toFwType: AttributeDef<FirmwareType>;
    location: AttributeDef<FirmwareUpdateLocation | null>;
    startType: AttributeDef<FirmwareUpdateStartType>;
};

export const firmwareFirmwareUpdateStartedEvent: EventDef<
    Attributes,
    EventType.FirmwareFirmwareUpdateStarted
> = {
    name: EventType.FirmwareFirmwareUpdateStarted,
    descriptionTrigger:
        'User initiates a firmware update or taps the retry button after a failed update attempt',
    changelog: [{ version: '25.1.2', notes: 'added' }],

    attributes: {
        model: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'Device model internal identifier',
        },
        fromBootloaderVersion: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'Bootloader version before the update',
        },
        fromFwVersion: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'Firmware version before the update',
        },
        toFwVersion: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'Target firmware version the device is updating to',
        },
        fromFwType: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'Type of firmware before update: `bitcoin-only`, `universal`, or `none`',
        },
        toFwType: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'Type of target firmware: `bitcoin-only` or `universal`',
        },
        location: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description:
                'Where the update was initiated: `settings` from device settings, `onboarding` during initial setup, `null` if not specified',
        },
        startType: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description:
                'How the update was started: `normal` for first attempt, `retry` if retrying after a previous failure',
        },
    },
};
