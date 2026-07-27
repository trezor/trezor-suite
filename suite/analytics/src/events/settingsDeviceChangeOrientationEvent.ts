import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    value: AttributeDef<0 | 90 | 180 | 270>;
};

export const settingsDeviceChangeOrientationEvent: EventDef<
    Attributes,
    EventType.SettingsDeviceChangeOrientation
> = {
    name: EventType.SettingsDeviceChangeOrientation,
    descriptionTrigger:
        'User changes the device display orientation in Settings > Device > Customization > Orientation',
    changelog: [{ version: '1.0.0', notes: 'added' }],

    attributes: {
        value: {
            description:
                'The screen rotation angle: 0 for normal, 90 for 90 degrees clockwise, 180 for upside down, 270 for 90 degrees counter-clockwise',
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
    },
};
