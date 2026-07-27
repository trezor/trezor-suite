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
    descriptionTrigger:
        'Desktop application begins or completes an update process, either automatically or manually initiated',
    changelog: [
        { version: '1.17.0', notes: 'added' },
        { version: '25.1.0', notes: 'updated' },
    ],

    attributes: {
        toVersion: {
            changelog: [{ version: '1.17.0', notes: 'added' }],
            description: 'The target version the application is updating to (e.g., `24.10.1`)',
        },
        status: {
            changelog: [{ version: '1.17.0', notes: 'added' }],
            description:
                'The current status of the update process. One of: `available`, `closed`, `download`, `downloaded`, `error`, `install-and-restart`, `install-on-quit`',
        },
        isPrerelease: {
            changelog: [{ version: '1.17.0', notes: 'added' }],
            description:
                'Whether the update is to a pre-release/beta version: `true` for pre-release, `false` for stable release',
        },
        earlyAccessProgram: {
            changelog: [{ version: '1.17.0', notes: 'added' }],
            description:
                'Whether the user is enrolled in the early access program for beta releases: `true` if enrolled, `false` if not',
        },
        isAutoUpdated: {
            changelog: [{ version: '25.1.0', notes: 'added' }],
            description:
                'Whether the update was performed automatically without user intervention: `true` for automatic updates, `false` for manual updates',
        },
    },
};
