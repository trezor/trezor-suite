import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const demoAccountQuestionnaireStartEvent: EventDef<
    {},
    EventType.DemoAccountQuestionnaireStart
> = {
    name: EventType.DemoAccountQuestionnaireStart,
    descriptionTrigger: 'User starts demo account questionnaire.',
    changelog: [{ version: '1.0.0', notes: 'added' }],
    attributes: {},
};
