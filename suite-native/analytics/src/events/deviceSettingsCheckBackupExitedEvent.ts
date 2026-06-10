import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    location: AttributeDef<string>;
};

export const deviceSettingsCheckBackupExitedEvent: EventDef<
    Attributes,
    EventType.DeviceSettingsCheckBackupExited
> = {
    name: EventType.DeviceSettingsCheckBackupExited,
    descriptionTrigger: 'User exits the device backup verification flow before it completes',
    changelog: [{ version: '25.8.1', notes: 'Added' }],
    attributes: {
        location: {
            changelog: [{ version: '25.8.1', notes: 'added' }],
            description:
                'The screen or step identifier where the user exited the backup verification flow (e.g., `CheckBackup`, `CheckBackupSuccess`, `CheckBackupFail`, `CheckBackupSupport`, `CheckBackupTutorial`)',
        },
    },
};
