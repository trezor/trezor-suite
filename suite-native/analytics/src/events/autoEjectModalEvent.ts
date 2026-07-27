import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type AutoEjectModalValue = 'enable' | 'skip';

type Attributes = {
    value: AttributeDef<AutoEjectModalValue>;
};

export const autoEjectModalEvent: EventDef<Attributes, EventType.AutoEjectModal> = {
    name: EventType.AutoEjectModal,
    descriptionTrigger:
        'User selects an option in the auto-eject confirmation modal when a device is first disconnected',
    changelog: [{ version: '25.8.1', notes: 'Added' }],
    attributes: {
        value: {
            changelog: [{ version: '25.8.1', notes: 'added' }],
            description:
                'User choice: `enable` to automatically eject device on disconnect, `skip` to disable auto-eject',
        },
    },
};
