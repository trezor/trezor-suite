import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type FirmwareType } from '@trezor/connect';
import { type DeviceModelInternal } from '@trezor/device-utils';

import { EventType } from '../constants';
import type { FirmwareUpdateStuckedState } from '../definitions';

type Attributes = {
    model: AttributeDef<DeviceModelInternal>;
    fromBootloaderVersion: AttributeDef<string>;
    fromFwVersion: AttributeDef<string>;
    toFwVersion: AttributeDef<string>;
    fromFwType: AttributeDef<FirmwareType | 'none'>;
    toFwType: AttributeDef<FirmwareType>;
    location: AttributeDef<'settings' | 'onboarding' | null>;
    duration: AttributeDef<number>;
    stuckedType: AttributeDef<FirmwareUpdateStuckedState>;
};

export const firmwareFirmwareUpdateStuckedEvent: EventDef<
    Attributes,
    EventType.FirmwareFirmwareUpdateStucked
> = {
    name: EventType.FirmwareFirmwareUpdateStucked,
    descriptionTrigger: 'User encounters a stuck firmware update and clicks the `Stucked` button to view recovery instructions or troubleshooting help',
    changelog: [{ version: '25.1.2', notes: 'Added' }],
    attributes: {
        model: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'The device model identifier',
        },
        fromBootloaderVersion: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'Bootloader version string aka `1.2.3`',
        },
        fromFwVersion: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'FW version or `none`',
        },
        toFwVersion: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'FW version aka `1.2.3`',
        },
        fromFwType: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'The firmware type before update (e.g., `official`, `beta`, or `none`)',
        },
        toFwType: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'The target firmware type (e.g., `official`, `beta`)',
        },
        location: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'Where the firmware update was initiated: `settings`, `onboarding`, or null',
        },
        duration: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'How long the firmware update process was stuck, in milliseconds',
        },
        stuckedType: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'The specific stuck state: `uploading` if stuck during upload, `installing` if stuck during installation, `restarting` if stuck during restart',
        },
    },
};
