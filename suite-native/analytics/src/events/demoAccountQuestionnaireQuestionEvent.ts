import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type DemoAccountQuestionnaireQuestion = 'reason' | 'suiteAction';

export type DemoAccountQuestionnaireQuestionOption =
    'considering' | 'ad' | 'friend' | 'none' | 'explore' | 'transaction' | 'hardwareWallet';

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
    changelog: [{ version: '25.12.1', notes: 'added' }],
    attributes: {
        option: {
            changelog: [{ version: '25.12.1', notes: 'added' }],
            description: `The selected option. For the \`reason\` question: \`considering\` (considering a hardware wallet), \`ad\` (saw an ad online), \`friend\` (a friend told them about Trezor). For the \`suiteAction\` question: \`explore\` (wanted to explore the app), \`transaction\` (wanted to try sending/receiving crypto), \`hardwareWallet\` (wanted to understand how a hardware wallet works with Suite). \`none\` is available on either question via the "None of the above" button.`,
        },
        question: {
            changelog: [{ version: '25.12.1', notes: 'added' }],
            description:
                'The question type: `reason` (why interested in Trezor), `suiteAction` (what they want to do in Suite)',
        },
    },
};
