import type { AttributeDef, EventDef } from '../../analyticsSchema';
import { EventType } from '../constants';

type Attributes = {
    option: AttributeDef<'connect' | 'close'>;
};

export const deviceConnectionDeviceFound: EventDef<
    EventType.DeviceConnectionDeviceFound,
    Attributes
> = {
    name: EventType.DeviceConnectionDeviceFound,
    descriptionTrigger:
        'User clicks on Connect button for any  nearby Trezor on Device Found Screen',
    addedInVersion: '25.11.1',
    changelog: '',
    lastUpdatedInVersion: '25.11.1',

    attributes: {
        option: {
            addedInVersion: '25.11.1',
            changelog: '',
        },
    },
};
