import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {};

export const demoAccountQuestionnaireDashboardEvent: EventDef<
    Attributes,
    // @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
    EventType.DemoAccountQuestionnaireDashboard
> = {
    name: EventType.DemoAccountQuestionnaireDashboard,
    descriptionTrigger: 'User clicks on "I don\'t have a Trezor" on dashboard',
    changelog: [{ version: '25.12.0', notes: 'added' }],
    attributes: {},
};
