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
    descriptionTrigger: 'User confirms or cancels THP (Trezor Host Protocol) device connection',
    changelog: [{ version: '26.2.1', notes: 'added' }],

    attributes: {
        option: {
            changelog: [
                { version: '26.2.1', notes: 'added' },
                {
                    version: '26.2.2',
                    notes: 'option values changed to `finished` | `canceled` on mobile',
                },
                {
                    version: '26.2.3',
                    notes: 'option values changed to `finished` | `canceled` on desktop',
                },
            ],
            description:
                'The outcome of the confirmation: `finished` if THP connection was confirmed, `canceled` if the user cancelled it',
        },
    },
};
