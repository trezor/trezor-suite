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
    descriptionTrigger:
        'User clicks on one of the articles or clicks on "Back to dashboard" button or clicks back',
    changelog: [{ version: '25.12.0', notes: 'added' }],
    attributes: {
        option: { changelog: [{ version: '25.12.0', notes: 'added' }] },
    },
};
