import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    symbol: AttributeDef<string>;
};

export const accountsEmptyAccountReceiveEvent: EventDef<
    Attributes,
    EventType.AccountsEmptyAccountReceive
> = {
    name: EventType.AccountsEmptyAccountReceive,
    descriptionTrigger:
        'User initiates a receive transaction from an account with empty transaction history',
    changelog: [{ version: '1.9.0', notes: 'added' }],

    attributes: {
        symbol: {
            changelog: [{ version: '1.9.0', notes: 'added' }],
            description: 'The cryptocurrency/token symbol of the account (e.g., `btc`, `eth`)',
        },
    },
};
