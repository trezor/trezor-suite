import type { EventDef } from '@suite-common/analytics-types';

import { EventType } from '../constants';

type Attributes = {};

export const dashboardSendModalEvent: EventDef<Attributes, EventType.DashboardSendModal> = {
    name: EventType.DashboardSendModal,
    descriptionTrigger: 'User clicks on Send button from dashboard',
    changelog: [{ version: '25.10.0', notes: 'added' }],

    attributes: {},
};
