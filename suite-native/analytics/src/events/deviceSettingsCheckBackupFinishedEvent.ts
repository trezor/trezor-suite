import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    success: AttributeDef<boolean>;
};

export const deviceSettingsCheckBackupFinishedEvent: EventDef<
    Attributes,
    EventType.DeviceSettingsCheckBackupFinished
> = {
    name: EventType.DeviceSettingsCheckBackupFinished,
    descriptionTrigger:
        'User completes the on-device backup verification by entering all seed words on the device hardware',
    changelog: [{ version: '25.8.1', notes: 'Added' }],
    attributes: {
        success: {
            changelog: [{ version: '25.8.1', notes: 'added' }],
            description:
                '`true` if all seed words were entered correctly and backup verification passed, `false` if there was a mismatch or verification failed',
        },
    },
};
