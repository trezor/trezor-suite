import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';
import type { FirmwareSource } from '../definitions';

type Attributes = {
    model: AttributeDef<string>;
    fromBlVersion: AttributeDef<string>;
    fromFwVersion: AttributeDef<string>;
    toFwVersion?: AttributeDef<string>;
    toBtcOnly?: AttributeDef<boolean>;
    firmwareSource: AttributeDef<FirmwareSource>;
    error: AttributeDef<string>;
};

export const deviceUpdateFirmwareEvent: EventDef<Attributes, EventType.DeviceUpdateFirmware> = {
    name: EventType.DeviceUpdateFirmware,
    descriptionTrigger:
        'User completes a firmware update on their device, including custom firmware installation if applicable',
    changelog: [{ version: '1.0.0', notes: 'added' }],

    attributes: {
        model: {
            changelog: [{ version: '24.7.0', notes: 'added' }],
            description: 'internal device model name',
        },
        fromBlVersion: {
            changelog: [{ version: '1.18.0', notes: 'added' }],
            description: 'version of bootloader before update started',
        },
        fromFwVersion: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
            description: 'version of firmware before update started',
        },
        toFwVersion: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
            description: 'version of the new firmware e.g 1.2.3',
        },
        toBtcOnly: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
            description: 'is new firmware bitcoin only variant',
        },
        firmwareSource: {
            changelog: [{ version: '25.4.1', notes: 'added' }],
            description:
                "checks if a device has official firmware based on authenticity checks ('official' | 'unknown' | 'NA - bootloader')",
        },
        error: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
            description: 'if finished with error, field contains error string, otherwise is empty',
        },
    },
};
