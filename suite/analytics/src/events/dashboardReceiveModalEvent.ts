import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {};

export const dashboardReceiveModalEvent: EventDef<Attributes, EventType.DashboardReceiveModal> = {
    name: EventType.DashboardReceiveModal,
    descriptionTrigger: 'User clicks on Receive button from dashboard',
    changelog: [{ version: '25.10.0', notes: 'added' }],

    attributes: {},
};
