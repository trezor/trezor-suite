import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type DemoAccountQuestionnaireLinkKey =
    | 'hardwareWallet'
    | 'trezorSecurity'
    | 'TS7'
    | 'dashboard';

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
    changelog: [{ version: '25.12.1', notes: 'added' }],
    attributes: {
        option: {
            changelog: [{ version: '25.12.1', notes: 'added' }],
            description: 'The selected link option',
        },
    },
};
