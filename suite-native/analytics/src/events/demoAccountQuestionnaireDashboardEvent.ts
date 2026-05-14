import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const demoAccountQuestionnaireDashboardEvent: EventDef<
    Attributes,
    EventType.DemoAccountQuestionnaireDashboard
> = {
    name: EventType.DemoAccountQuestionnaireDashboard,
    descriptionTrigger: 'User clicks on "I don\'t have a Trezor" on dashboard',
    changelog: [{ version: '25.12.0', notes: 'added' }],
    attributes: {},
};
