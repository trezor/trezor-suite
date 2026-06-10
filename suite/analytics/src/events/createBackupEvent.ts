import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    status: AttributeDef<'finished' | 'error'>;
    error: AttributeDef<string>;
};

export const createBackupEvent: EventDef<Attributes, EventType.CreateBackup> = {
    name: EventType.CreateBackup,
    descriptionTrigger:
        'User creates a backup of their device in the Settings > Device > Backup section',
    possibleImprovements: 'rename to `settings/device/backup`',
    changelog: [
        {
            version: '1.17.0',
            notes: 'Added',
        },
    ],

    attributes: {
        status: {
            description:
                'The backup operation result: `finished` when backup completed successfully, `error` when backup failed',
            changelog: [{ version: '1.17.0', notes: 'added' }],
        },
        error: {
            description: 'Error details if backup failed, empty or undefined if backup succeeded',
            changelog: [{ version: '1.17.0', notes: 'added' }],
        },
    },
};
