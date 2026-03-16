import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type FirmwareType } from '@trezor/connect';

import { EventType } from '../constants';
import { type FirmwareUpdateLocation } from '../definitions';

type Attributes = {
    model: AttributeDef<string>;
    fromBootloaderVersion: AttributeDef<string>;
    fromFwVersion: AttributeDef<string>;
    toFwVersion: AttributeDef<string>;
    fromFwType: AttributeDef<FirmwareType | 'none'>;
    toFwType: AttributeDef<FirmwareType>;
    location: AttributeDef<FirmwareUpdateLocation>;
};

export const firmwareFirmwareUpdateCancelEvent: EventDef<
    Attributes,
    EventType.FirmwareFirmwareUpdateCancel
> = {
    name: EventType.FirmwareFirmwareUpdateCancel,
    descriptionTrigger: 'User cancel FW update confirmation on device or in app.',
    changelog: [{ version: '25.1.2', notes: 'added' }],

    attributes: {
        model: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'Device model internal identifier',
        },
        fromBootloaderVersion: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'Bootloader version before update',
        },
        fromFwVersion: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'Firmware version before update',
        },
        toFwVersion: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'Target firmware version',
        },
        fromFwType: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'Firmware type before update',
        },
        toFwType: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'Target firmware type',
        },
        location: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'Location where the update was started',
        },
    },
};
