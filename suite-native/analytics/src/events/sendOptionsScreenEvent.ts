import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type SendOptionsScreenOption = 'account' | 'close';

type Attributes = {
    option: AttributeDef<SendOptionsScreenOption>;
};

export const sendOptionsScreenEvent: EventDef<Attributes, EventType.SendOptionsScreen> = {
    name: EventType.SendOptionsScreen,
    descriptionTrigger: 'User selects an option on the send account selection screen',
    changelog: [{ version: '26.8.1', notes: 'added' }],
    attributes: {
        option: {
            description:
                'Selected option: `account` to send from an account or `close` to leave the screen',
            changelog: [{ version: '26.8.1', notes: 'added' }],
        },
    },
};
