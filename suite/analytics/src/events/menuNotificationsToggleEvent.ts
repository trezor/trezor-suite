import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    value: AttributeDef<boolean>;
};

export const menuNotificationsToggleEvent: EventDef<Attributes, EventType.MenuNotificationsToggle> =
    {
        name: EventType.MenuNotificationsToggle,
        descriptionTrigger:
            'User clicks the bell icon in the top-right corner to toggle notification settings on or off',
        changelog: [{ version: '1.9.0', notes: 'added' }],

        attributes: {
            value: {
                changelog: [{ version: '1.9.0', notes: 'added' }],
                description:
                    'Inverse of the dropdown open state: `false` when the notifications dropdown is being opened, `true` when it is being closed.',
            },
        },
    };
