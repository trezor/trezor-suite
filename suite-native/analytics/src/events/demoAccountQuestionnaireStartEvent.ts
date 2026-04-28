import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const demoAccountQuestionnaireStartEvent: EventDef<
    Attributes,
    EventType.DemoAccountQuestionnaireStart
> = {
    name: EventType.DemoAccountQuestionnaireStart,
    descriptionTrigger: 'User clicks "Sure, continue" in Demo Account questionnaire',
    changelog: [{ version: '25.12.0', notes: 'added' }],
    attributes: {},
};
