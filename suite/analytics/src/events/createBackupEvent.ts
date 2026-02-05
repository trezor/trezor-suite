import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    status: AttributeDef<'finished' | 'error'>;
    error: AttributeDef<string>;
};

// @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
export const createBackupEvent: EventDef<Attributes, EventType.CreateBackup> = {
    name: EventType.CreateBackup,
    descriptionTrigger: 'Create backup modal',
    possibleImprovements: 'rename to `settings/device/backup`',
    changelog: [
        {
            version: '1.17.0',
            notes: 'Added',
        },
    ],

    attributes: {
        status: {
            changelog: [{ version: '1.17.0', notes: 'added' }],
        },
        error: {
            changelog: [{ version: '1.17.0', notes: 'added' }],
        },
    },
};
