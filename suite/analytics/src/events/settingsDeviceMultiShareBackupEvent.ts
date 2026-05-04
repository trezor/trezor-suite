import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<'start' | 'done' | 'learn-more' | 'close-modal'>;
};

export const settingsDeviceMultiShareBackupEvent: EventDef<
    Attributes,
    EventType.SettingsDeviceMultiShareBackup
> = {
    name: EventType.SettingsDeviceMultiShareBackup,
    descriptionTrigger:
        'When Multi share flow is started/abandoned/finished or if learn-more button is clicked',
    changelog: [{ version: '24.6.1', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '24.6.1', notes: 'added' }],
            description: 'The action taken in the Multi-Share backup flow: "start" when flow begins, "done" when backup is completed, "learn-more" when user clicks the information button, "close-modal" when user dismisses the modal',
        },
    },
};
