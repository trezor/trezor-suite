import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';
import type { DemoAccountQuestionnaireLinkKey } from '../definitions';

type Attributes = {
    option: AttributeDef<DemoAccountQuestionnaireLinkKey>;
};

export const demoAccountQuestionnaireLinksEvent: EventDef<
    Attributes,
    EventType.DemoAccountQuestionnaireLinks
> = {
    name: EventType.DemoAccountQuestionnaireLinks,
    descriptionTrigger: 'User clicks a link in demo account questionnaire.',
    changelog: [{ version: '1.0.0', notes: 'added' }],
    attributes: {
        option: { changelog: [{ version: '1.0.0', notes: 'added' }] },
    },
};
