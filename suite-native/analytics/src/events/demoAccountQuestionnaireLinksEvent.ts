import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type DemoAccountQuestionnaireLinkKey =
    'hardwareWallet' | 'trezorSecurity' | 'TS7' | 'dashboard';

type Attributes = {
    option: AttributeDef<DemoAccountQuestionnaireLinkKey>;
};

export const demoAccountQuestionnaireLinksEvent: EventDef<
    Attributes,
    EventType.DemoAccountQuestionnaireLinks
> = {
    name: EventType.DemoAccountQuestionnaireLinks,
    descriptionTrigger:
        'User clicks on an educational article link or returns to the dashboard from the demo account questionnaire',
    changelog: [{ version: '25.12.1', notes: 'added' }],
    attributes: {
        option: {
            changelog: [{ version: '25.12.1', notes: 'added' }],
            description:
                'The selected link: `hardwareWallet`, `trezorSecurity`, or `TS7` (Trezor Safe 7) for a recommended article; `dashboard` for returning to the dashboard',
        },
    },
};
