import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type EmptyDashboardAction = 'syncCoins' | 'connectDevice';

type Attributes = {
    action: AttributeDef<EmptyDashboardAction>;
};

export const emptyDashboardActionEvent: EventDef<Attributes, EventType.EmptyDashboardAction> = {
    name: EventType.EmptyDashboardAction,
    descriptionTrigger: 'User performs an action on the empty dashboard crossroads screen',
    changelog: [{ version: '23.11.1', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '23.11.1', notes: 'added' }],
            description:
                'The action selected: `syncCoins` to sync available coins, `connectDevice` to connect a device',
        },
    },
};
