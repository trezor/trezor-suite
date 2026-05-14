import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';
import { type AppUpdateEventStatus } from '../definitions';

type Attributes = {
    toVersion?: AttributeDef<string | undefined>;
    status: AttributeDef<AppUpdateEventStatus>;
    earlyAccessProgram: AttributeDef<boolean>;
    isPrerelease?: AttributeDef<boolean>;
    isAutoUpdated?: AttributeDef<boolean>;
};

export const appUpdateEvent: EventDef<Attributes, EventType.AppUpdate> = {
    name: EventType.AppUpdate,
    descriptionTrigger: 'Desktop app is in a process of updating.',
    changelog: [
        { version: '1.17.0', notes: 'added' },
        { version: '25.1.0', notes: 'updated' },
    ],

    attributes: {
        toVersion: {
            changelog: [{ version: '1.17.0', notes: 'added' }],
        },
        status: {
            changelog: [{ version: '1.17.0', notes: 'added' }],
        },
        isPrerelease: {
            changelog: [{ version: '1.17.0', notes: 'added' }],
        },
        earlyAccessProgram: {
            changelog: [{ version: '1.17.0', notes: 'added' }],
        },
        isAutoUpdated: {
            changelog: [{ version: '25.1.0', notes: 'added' }],
        },
    },
};
