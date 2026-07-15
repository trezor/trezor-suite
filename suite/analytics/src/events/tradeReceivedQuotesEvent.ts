import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<'buy' | 'sell' | 'exchange'>;
    count: AttributeDef<number>;
};

export const tradeReceivedQuotesEvent: EventDef<Attributes, EventType.TradeReceivedQuotes> = {
    name: EventType.TradeReceivedQuotes,
    descriptionTrigger:
        'Trading quotes (prices and offers) are fetched and received from provider services',
    changelog: [{ version: '25.10.0', notes: 'added' }],

    attributes: {
        type: {
            description:
                'The type of trading transaction: `buy` for purchasing cryptocurrency, `sell` for selling, `exchange` for swapping',
            changelog: [{ version: '25.10.0', notes: 'added' }],
        },
        count: {
            changelog: [{ version: '25.10.0', notes: 'added' }],
            description: 'Number of quotes received from trading providers',
        },
    },
};
