import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type ReceiveOptionsScreenOption = 'account' | 'close' | 'addAccount';

type Attributes = {
    option: AttributeDef<ReceiveOptionsScreenOption>;
};

export const receiveOptionsScreenEvent: EventDef<Attributes, EventType.ReceiveOptionsScreen> = {
    name: EventType.ReceiveOptionsScreen,
    descriptionTrigger: 'User selects an option on the receive account selection screen',
    changelog: [{ version: '26.8.1', notes: 'added' }],
    attributes: {
        option: {
            description:
                'Selected option: `account` to receive to an account, `close` to leave the screen, or `addAccount` to add an account',
            changelog: [{ version: '26.8.1', notes: 'added' }],
        },
    },
};
