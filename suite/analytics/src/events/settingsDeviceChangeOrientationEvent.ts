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
    descriptionTrigger: 'Settings > Device > CUSTOMIZATION > Orientation',
    changelog: [{ version: '1.0.0', notes: 'added' }],

    attributes: {
        value: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
    },
};
