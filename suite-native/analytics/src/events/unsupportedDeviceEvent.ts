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
    descriptionTrigger: 'User attempts to connect a device that is not supported (missing seed, in bootloader mode, or with unsupported firmware). This is so far reported only if user click on the Eject button!',
    changelog: [{ version: '23.11.1', notes: 'Added' }],
    attributes: {
        deviceState: {
            changelog: [{ version: '23.11.1', notes: 'added' }],
            description: '"unsupportedFirmware" for incompatible firmware, "noSeed" when device has no recovery seed, "bootloaderMode" when device is in firmware update mode, "noSeedWithFirmware" for devices missing seed but with firmware',
        },
    },
};
