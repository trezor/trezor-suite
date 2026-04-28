import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const settingsDeviceChangePinEvent: EventDef<Attributes, EventType.SettingsDeviceChangePin> =
    {
        name: EventType.SettingsDeviceChangePin,
        descriptionTrigger: 'Settings > Device > SECURITY > Change PIN (Only when PIN is set)',
        changelog: [{ version: '1.0.0', notes: 'added' }],

        attributes: {},
    };
