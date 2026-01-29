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
    descriptionTrigger: 'Accounts > Account with empty transaction history > Receive XXX',
    changelog: [{ version: '1.9.0', notes: 'added' }],

    attributes: {
        symbol: {
            changelog: [{ version: '1.9.0', notes: 'added' }],
        },
    },
};
