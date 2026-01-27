import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    option?: AttributeDef<'confirmed' | 'close'>;
};

export const deviceConnectionDeviceConfirmationEvent: EventDef<
    Attributes,
    EventType.DeviceConnectionDeviceConfirmation
> = {
    name: EventType.DeviceConnectionDeviceConfirmation,
    descriptionTrigger: 'User finish THP pairing (successfully  or cancelled)',
    changelog: [{ version: '?', notes: 'added' }],

    attributes: {
        option: {
            changelog: [{ version: '?', notes: 'added' }],
            description: '‘confirmed’ on successful THP connection, ‘close’ if cancelled',
        },
    },
};
