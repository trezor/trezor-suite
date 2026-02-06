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

// @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
export const unsupportedDeviceEvent: EventDef<Attributes, EventType.UnsupportedDevice> = {
    name: EventType.UnsupportedDevice,
    descriptionTrigger: 'When user tries to connect device that is not supported.',
    description: 'This is so far reported only if user click on the Eject button!',
    changelog: [{ version: '23.11.1', notes: 'Added' }],
    attributes: {
        deviceState: {
            changelog: [{ version: '23.11.1', notes: 'added' }],
        },
    },
};
