import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<string>;
};

export const dashboardActionsEvent: EventDef<Attributes, EventType.DashboardActions> = {
    name: EventType.DashboardActions,
    descriptionTrigger:
        'Fired on every `Buy & Sell` and `Swap` click in the header on the dashboard page.',
    changelog: [{ version: '24.11.0', notes: 'added' }],

    attributes: {
        type: {
            changelog: [{ version: '24.11.0', notes: 'added' }],
            description:
                'The route navigated to from the dashboard header (e.g., `wallet-trading-buy`, `wallet-trading-exchange`)',
        },
    },
};
