import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type UnsupportedDeviceState =
    | 'unsupportedFirmware'
    | 'noSeed'
    | 'bootloaderMode'
    | 'noSeedWithFirmware';

type Attributes = {
    deviceState: AttributeDef<UnsupportedDeviceState>;
};

export const unsupportedDeviceEvent: EventDef<Attributes, EventType.UnsupportedDevice> = {
    name: EventType.UnsupportedDevice,
    descriptionTrigger:
        'User presses the primary CTA button in an unsupported-device error modal: "Eject" for incompatible firmware, or "Open Suite Web" for devices with no seed',
    changelog: [{ version: '23.11.1', notes: 'Added' }],
    attributes: {
        deviceState: {
            changelog: [{ version: '23.11.1', notes: 'added' }],
            description: `The state of the unsupported device:
- \`unsupportedFirmware\`: incompatible firmware
- \`noSeed\`: device has no recovery seed
- \`bootloaderMode\`: device is in firmware update mode
- \`noSeedWithFirmware\`: device has firmware but no seed`,
        },
    },
};
