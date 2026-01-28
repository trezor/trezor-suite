import type { EventDef } from '@suite-common/analytics-types';

import { EventType } from '../constants';

type Attributes = {};

export const settingsDeviceChangePinEvent: EventDef<Attributes, EventType.SettingsDeviceChangePin> =
    {
        name: EventType.SettingsDeviceChangePin,
        descriptionTrigger: 'Settings > Device > SECURITY > Change PIN (Only when PIN is set)',
        changelog: [{ version: '1.0.0', notes: 'added' }],

        attributes: {},
    };
