import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    option: AttributeDef<'connect' | 'close'>;
};

export const deviceConnectionDeviceFoundEvent: EventDef<
    Attributes,
    EventType.DeviceConnectionDeviceFound
> = {
    name: EventType.DeviceConnectionDeviceFound,
    descriptionTrigger:
        'User clicks the connect button for a nearby Trezor device on the Device Found screen',
    changelog: [{ version: '25.11.1', notes: 'added' }],

    attributes: {
        option: {
            description:
                'The user action: `connect` to establish connection, `close` to dismiss the screen',
            changelog: [{ version: '25.11.1', notes: 'added' }],
        },
    },
};
