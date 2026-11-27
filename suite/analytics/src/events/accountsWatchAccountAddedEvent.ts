import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    symbol: AttributeDef<string>;
};

export const accountsWatchAccountAddedEvent: EventDef<
    Attributes,
    EventType.AccountsWatchAccountAdded
> = {
    name: EventType.AccountsWatchAccountAdded,
    descriptionTrigger:
        'User adds a watch-only account via Accounts menu > + button > Watch-only, or the watch link (debug mode only)',
    changelog: [{ version: '26.12.0', notes: 'added' }],

    attributes: {
        symbol: {
            description:
                'The blockchain network symbol: `eth` for Ethereum, `sol` for Solana, etc.',
            changelog: [{ version: '26.12.0', notes: 'added' }],
        },
    },
};
