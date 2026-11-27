import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    symbol: AttributeDef<string>;
};

export const accountsWatchAccountRemovedEvent: EventDef<
    Attributes,
    EventType.AccountsWatchAccountRemoved
> = {
    name: EventType.AccountsWatchAccountRemoved,
    descriptionTrigger: 'User removes a watch-only account on its Details tab (debug mode only)',
    changelog: [{ version: '26.12.0', notes: 'added' }],

    attributes: {
        symbol: {
            description:
                'The blockchain network symbol: `eth` for Ethereum, `sol` for Solana, etc.',
            changelog: [{ version: '26.12.0', notes: 'added' }],
        },
    },
};
