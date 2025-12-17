import type { AttributeDef, EventDef } from '../../analyticsSchema';

type Attributes = {
    option: AttributeDef<'connect' | 'close'>;
};

export const deviceConnectionDeviceFound = {
    name: 'device-connection/device-found',
    descriptionTrigger:
        'User clicks on Connect button for any  nearby Trezor on Device Found Screen',
    changelog: [{ version: '25.11.1', notes: 'added' }],

    attributes: {
        option: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
        },
    },
} satisfies EventDef<Attributes>;
