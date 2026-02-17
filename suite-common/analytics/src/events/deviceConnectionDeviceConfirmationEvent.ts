import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    option?: AttributeDef<'finished' | 'canceled'>;
};

export const deviceConnectionDeviceConfirmationEvent: EventDef<
    Attributes,
    EventType.DeviceConnectionDeviceConfirmation
> = {
    name: EventType.DeviceConnectionDeviceConfirmation,
    descriptionTrigger: 'User confirms/cancels THP connection',
    changelog: [{ version: '?', notes: 'added' }],

    attributes: {
        option: {
            changelog: [
                { version: '?', notes: 'added' },
                { version: '26.3.0', notes: 'option values changed to ‘finished’ | ‘canceled’' },
            ],
            description: '‘finished’ if THP connection is confirmed, ‘canceled’ if canceled',
        },
    },
};
