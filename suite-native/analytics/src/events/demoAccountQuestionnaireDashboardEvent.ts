import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const demoAccountQuestionnaireDashboardEvent: EventDef<
    Attributes,
    EventType.DemoAccountQuestionnaireDashboard
> = {
    name: EventType.DemoAccountQuestionnaireDashboard,
    descriptionTrigger:
        "User clicks on `I don't have a Trezor` button on the dashboard to start the demo account questionnaire",
    changelog: [{ version: '25.12.1', notes: 'added' }],
    attributes: {},
};
