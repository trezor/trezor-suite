import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {};

export const demoAccountQuestionnaireStartEvent: EventDef<
    Attributes,
    // @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
    EventType.DemoAccountQuestionnaireStart
> = {
    name: EventType.DemoAccountQuestionnaireStart,
    descriptionTrigger: 'User clicks "Sure, continue" in Demo Account questionnaire',
    changelog: [{ version: '25.12.0', notes: 'added' }],
    attributes: {},
};
