import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<string>;
};

export const dashboardActionsEvent: EventDef<Attributes, EventType.DashboardActions> = {
    name: EventType.DashboardActions,
    descriptionTrigger:
        'Fired when the `Buy & Sell` button in the dashboard header is clicked, but only on wider viewports where the dedicated button (not the dropdown) is shown. Narrower viewports report `trade/navigate` instead. Note: this event is largely superseded by `trade/navigate`.',
    changelog: [{ version: '24.11.0', notes: 'added' }],

    attributes: {
        type: {
            changelog: [{ version: '24.11.0', notes: 'added' }],
            description:
                'The route navigated to from the dashboard header. Currently only `wallet-trading-buy` is emitted (from the `Buy & Sell` button).',
        },
    },
};
