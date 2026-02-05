import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    option: AttributeDef<'connect' | 'close'>;
};

export const deviceConnectionDeviceFoundEvent: EventDef<
    Attributes,
    // @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
    EventType.DeviceConnectionDeviceFound
> = {
    name: EventType.DeviceConnectionDeviceFound,
    descriptionTrigger:
        'User clicks on Connect button for any  nearby Trezor on Device Found Screen',
    changelog: [{ version: '25.11.1', notes: 'added' }],

    attributes: {
        option: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
        },
    },
};
