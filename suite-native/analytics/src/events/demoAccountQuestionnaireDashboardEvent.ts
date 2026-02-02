import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const demoAccountQuestionnaireDashboardEvent: EventDef<
    {},
    EventType.DemoAccountQuestionnaireDashboard
> = {
    name: EventType.DemoAccountQuestionnaireDashboard,
    descriptionTrigger: 'User sees demo account questionnaire on dashboard.',
    changelog: [{ version: '1.0.0', notes: 'added' }],
    attributes: {},
};
