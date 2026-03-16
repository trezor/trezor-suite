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
        'On displayed stucked button, user clicked it and displayed part 1 or part 2 or modal that should help resolve that',
    changelog: [{ version: '25.1.2', notes: 'Added' }],
    attributes: {
        model: { changelog: [{ version: '25.1.2', notes: 'added' }] },
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
        fromFwType: { changelog: [{ version: '25.1.2', notes: 'added' }] },
        toFwType: { changelog: [{ version: '25.1.2', notes: 'added' }] },
        location: { changelog: [{ version: '25.1.2', notes: 'added' }] },
        duration: { changelog: [{ version: '25.1.2', notes: 'added' }] },
        stuckedType: { changelog: [{ version: '25.1.2', notes: 'added' }] },
    },
};
