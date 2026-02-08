import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<'buy' | 'sell' | 'exchange'>;
    count: AttributeDef<number>;
};

export const tradeReceivedQuotesEvent: EventDef<Attributes, EventType.TradeReceivedQuotes> = {
    name: EventType.TradeReceivedQuotes,
    descriptionTrigger: 'Quotes for buy/sell/swap are fetched',
    changelog: [{ version: '25.10.0', notes: 'added' }],

    attributes: {
        type: {
            changelog: [{ version: '25.10.0', notes: 'added' }],
        },
        count: {
            changelog: [{ version: '25.10.0', notes: 'added' }],
            description: 'Number of quotes received',
        },
    },
};
