import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    status: AttributeDef<'finished' | 'error'>;
    error?: AttributeDef<string>;
};

export const settingsDeviceCheckSeedEvent: EventDef<Attributes, EventType.SettingsDeviceCheckSeed> =
    {
        name: EventType.SettingsDeviceCheckSeed,
        descriptionTrigger: 'Settings > Device > Check backup',
        changelog: [
            {
                version: '1.19.0',
                notes: 'Two events merged into one in 1.19. check-seed/error and check-seed/success to settings/device/check-seed.',
            },
        ],

        attributes: {
            status: {
                changelog: [{ version: '1.19.0', notes: 'added' }],
            },
            error: {
                changelog: [{ version: '1.19.0', notes: 'added' }],
            },
        },
    };
