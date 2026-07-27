import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const demoAccountQuestionnaireStartEvent: EventDef<
    Attributes,
    EventType.DemoAccountQuestionnaireStart
> = {
    name: EventType.DemoAccountQuestionnaireStart,
    descriptionTrigger:
        'User clicks `Sure, continue` to proceed with the demo account questionnaire and start accessing the app',
    changelog: [{ version: '25.12.1', notes: 'added' }],
    attributes: {},
};
