import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type DashboardReceiveModalEventSource = 'page-header' | 'empty-wallet';

type Attributes = {
    source: AttributeDef<DashboardReceiveModalEventSource>;
};

export const dashboardReceiveModalEvent: EventDef<Attributes, EventType.DashboardReceiveModal> = {
    name: EventType.DashboardReceiveModal,
    descriptionTrigger: 'User clicks on Receive button from dashboard',
    changelog: [{ version: '25.10.0', notes: 'added' }],

    attributes: {
        source: {
            changelog: [{ version: '26.3.0', notes: 'added' }],
        },
    },
};
