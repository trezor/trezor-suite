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
    descriptionTrigger:
        'User encounters a stuck firmware update and clicks the `Stucked` button to view recovery instructions or troubleshooting help',
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
            description: 'The firmware type before update: `bitcoin-only`, `universal`, or `none`',
        },
        toFwType: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'The target firmware type: `bitcoin-only` or `universal`',
        },
        location: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description:
                'Where the firmware update was initiated: `settings`, `onboarding`, or `null`',
        },
        duration: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'How long the firmware update process was stuck, in seconds',
        },
        stuckedType: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: `The step at which the stuck state was reported:
- \`buttonVisible\`: the "I might be stuck" button appears after a timeout on the installation screen (no user action yet)
- \`modalPart1\`: user presses the button to open the recovery bottom sheet
- \`modalPart2\`: user advances to the second screen of the bottom sheet (recovery tips)`,
        },
    },
};
