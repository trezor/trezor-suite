import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    screen: AttributeDef<string>;
};

export const passphraseExitEvent: EventDef<Attributes, EventType.PassphraseExit> = {
    name: EventType.PassphraseExit,
    descriptionTrigger: 'Exit from passphrase flow without adding wallet.',
    changelog: [{ version: '24.7.2', notes: 'added' }],
    attributes: {
        screen: {
            changelog: [{ version: '24.7.2', notes: 'added' }],
            description: 'Route name of the screen from which user exited the flow.',
        },
    },
};
