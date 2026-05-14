import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type DashboardSendModalEventSource = 'page-header';

type Attributes = {
    source: AttributeDef<DashboardSendModalEventSource>;
};

export const dashboardSendModalEvent: EventDef<Attributes, EventType.DashboardSendModal> = {
    name: EventType.DashboardSendModal,
    descriptionTrigger: 'User clicks on Send button from dashboard',
    changelog: [{ version: '25.10.0', notes: 'added' }],

    attributes: {
        source: {
            changelog: [{ version: '26.3.0', notes: 'added' }],
        },
    },
};
