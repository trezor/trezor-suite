import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type EmptyDashboardAction = 'syncCoins' | 'connectDevice';

type Attributes = {
    action: AttributeDef<EmptyDashboardAction>;
};

export const emptyDashboardActionEvent: EventDef<Attributes, EventType.EmptyDashboardAction> = {
    name: EventType.EmptyDashboardAction,
    descriptionTrigger: 'Click on something on crossroads screen',
    changelog: [{ version: '23.11.1', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '23.11.1', notes: 'added' }],
            description: 'The action performed',
        },
    },
};
