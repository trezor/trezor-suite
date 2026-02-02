import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type DemoAccountQuestionnaireQuestion = 'reason' | 'suiteAction';

export type DemoAccountQuestionnaireQuestionOption =
    | 'considering'
    | 'ad'
    | 'friend'
    | 'none'
    | 'explore'
    | 'transaction'
    | 'hardwareWallet';

type Attributes = {
    option: AttributeDef<DemoAccountQuestionnaireQuestionOption>;
    question: AttributeDef<DemoAccountQuestionnaireQuestion>;
};

export const demoAccountQuestionnaireQuestionEvent: EventDef<
    Attributes,
    EventType.DemoAccountQuestionnaireQuestion
> = {
    name: EventType.DemoAccountQuestionnaireQuestion,
    descriptionTrigger: 'User selects one of the options and clicks continue or clicks None',
    changelog: [{ version: '25.12.0', notes: 'added' }],
    attributes: {
        option: {
            changelog: [{ version: '25.12.0', notes: 'added' }],
            description: 'The selected option',
        },
        question: {
            changelog: [{ version: '25.12.0', notes: 'added' }],
            description: 'The question identifier',
        },
    },
};
