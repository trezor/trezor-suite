import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    value: AttributeDef<boolean>;
};

export const menuNotificationsToggleEvent: EventDef<Attributes, EventType.MenuNotificationsToggle> =
    {
        name: EventType.MenuNotificationsToggle,
        descriptionTrigger: 'Notification (Bell icon in top-right corner)',
        changelog: [{ version: '1.9.0', notes: 'added' }],

        attributes: {
            value: {
                changelog: [{ version: '1.9.0', notes: 'added' }],
            },
        },
    };
