import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    value: AttributeDef<boolean>;
};

export const settingsDeviceChangeHapticFeedbackEvent: EventDef<
    Attributes,
    EventType.SettingsDeviceChangeHapticFeedback
> = {
    name: EventType.SettingsDeviceChangeHapticFeedback,
    descriptionTrigger: '?',
    changelog: [{ version: '?', notes: 'added' }],

    attributes: {
        value: {
            changelog: [{ version: '?', notes: 'added' }],
        },
    },
};
