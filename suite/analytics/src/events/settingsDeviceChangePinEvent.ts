import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const settingsDeviceChangePinEvent: EventDef<Attributes, EventType.SettingsDeviceChangePin> =
    {
        name: EventType.SettingsDeviceChangePin,
        descriptionTrigger:
            'User changes or configures PIN protection in Settings > Device > Security > Change PIN',
        changelog: [{ version: '1.0.0', notes: 'added' }],

        attributes: {},
    };
