import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    status: AttributeDef<'finished' | 'error'>;
    error?: AttributeDef<string>;
};

export const settingsDeviceCheckSeedEvent: EventDef<Attributes, EventType.SettingsDeviceCheckSeed> =
    {
        name: EventType.SettingsDeviceCheckSeed,
        descriptionTrigger: 'User verifies their backup/seed in Settings > Device > Check Backup',
        changelog: [
            {
                version: '1.19.0',
                notes: 'Two events merged into one in 1.19. check-seed/error and check-seed/success to settings/device/check-seed.',
            },
        ],

        attributes: {
            status: {
                description:
                    'The backup verification result: `finished` when verification completed successfully, `error` if verification failed',
                changelog: [{ version: '1.19.0', notes: 'added' }],
            },
            error: {
                description:
                    'Error details if backup verification failed, undefined if verification succeeded',
                changelog: [{ version: '1.19.0', notes: 'added' }],
            },
        },
    };
