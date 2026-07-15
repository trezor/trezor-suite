import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    value?: AttributeDef<number>;
};

export const settingsDeviceChangeBrightnessEvent: EventDef<
    Attributes,
    EventType.SettingsDeviceChangeBrightness
> = {
    name: EventType.SettingsDeviceChangeBrightness,
    descriptionTrigger: 'User adjusts the screen brightness level on their device',
    changelog: [{ version: '24.6.1', notes: 'added' }],

    attributes: {
        value: {
            description: 'The brightness level set by the user',
            changelog: [{ version: '24.6.1', notes: 'added' }],
        },
    },
};
