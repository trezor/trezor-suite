import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';
import type {
    DemoAccountQuestionnaireQuestion,
    DemoAccountQuestionnaireQuestionOption,
} from '../definitions';

type Attributes = {
    option: AttributeDef<DemoAccountQuestionnaireQuestionOption>;
    question: AttributeDef<DemoAccountQuestionnaireQuestion>;
};

export const demoAccountQuestionnaireQuestionEvent: EventDef<
    Attributes,
    EventType.DemoAccountQuestionnaireQuestion
> = {
    name: EventType.DemoAccountQuestionnaireQuestion,
    descriptionTrigger:
        'User clicks on one of the articles or clicks on "Back to dashboard" button or clicks back',
    changelog: [{ version: '25.12.0', notes: 'added' }],
    attributes: {
        option: { changelog: [{ version: '25.12.0', notes: 'added' }] },
        question: { changelog: [{ version: '25.12.0', notes: 'added' }] },
    },
};
