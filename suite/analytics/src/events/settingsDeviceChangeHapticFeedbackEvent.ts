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
    descriptionTrigger: 'User toggles haptic feedback on or off in device settings',
    changelog: [{ version: '24.6.1', notes: 'added' }],

    attributes: {
        value: {
            description: 'Whether haptic feedback is enabled (`true`) or disabled (`false`)',
            changelog: [{ version: '24.6.1', notes: 'added' }],
        },
    },
};
