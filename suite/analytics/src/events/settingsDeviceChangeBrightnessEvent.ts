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
    descriptionTrigger: '?',
    changelog: [{ version: '?', notes: 'added' }],

    attributes: {
        value: {
            changelog: [{ version: '?', notes: 'added' }],
        },
    },
};
