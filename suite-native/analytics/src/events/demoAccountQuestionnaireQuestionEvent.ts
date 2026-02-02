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
    descriptionTrigger: 'User answers a question in demo account questionnaire.',
    changelog: [{ version: '1.0.0', notes: 'added' }],
    attributes: {
        option: { changelog: [{ version: '1.0.0', notes: 'added' }] },
        question: { changelog: [{ version: '1.0.0', notes: 'added' }] },
    },
};
