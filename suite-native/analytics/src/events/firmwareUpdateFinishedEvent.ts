import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { FirmwareType } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import { EventType } from '../constants';

type Attributes = {
    model: AttributeDef<DeviceModelInternal>;
    fromBootloaderVersion: AttributeDef<string>;
    fromFwVersion: AttributeDef<string>;
    toFwVersion: AttributeDef<string>;
    fromFwType: AttributeDef<FirmwareType | 'none'>;
    toFwType: AttributeDef<FirmwareType>;
    location: AttributeDef<'settings' | 'onboarding' | null>;
    duration: AttributeDef<number>;
    error?: AttributeDef<string | undefined>;
};

export const firmwareUpdateFinishedEvent: EventDef<Attributes, EventType.FirmwareUpdateFinished> = {
    name: EventType.FirmwareUpdateFinished,
    descriptionTrigger: 'Update finished - either success or error',
    changelog: [{ version: '25.5.1', notes: 'Added attribute - @location (fw)' }],
    attributes: {
        model: { changelog: [{ version: '25.5.1', notes: 'added' }] },
        fromBootloaderVersion: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Bootloader version string aka 1.2.3',
        },
        fromFwVersion: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'FW version or `none`',
        },
        toFwVersion: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'FW version aka 1.2.3',
        },
        fromFwType: { changelog: [{ version: '25.5.1', notes: 'added' }] },
        toFwType: { changelog: [{ version: '25.5.1', notes: 'added' }] },
        location: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description:
                'Determines from which app flow was the FW installed/updated. Possible values: `settings` | `onboarding`',
        },
        duration: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Duration of FW update in seconds',
        },
        error: { changelog: [{ version: '25.5.1', notes: 'added' }] },
    },
};
