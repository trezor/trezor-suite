import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const demoAccountQuestionnaireDashboardEvent: EventDef<
    {},
    EventType.DemoAccountQuestionnaireDashboard
> = {
    name: EventType.DemoAccountQuestionnaireDashboard,
    descriptionTrigger: 'User clicks on "I don\'t have a Trezor" on dashboard',
    changelog: [{ version: '25.12.0', notes: 'added' }],
    attributes: {},
};
