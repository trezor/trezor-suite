import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<'buy' | 'sell' | 'exchange'>;
    count: AttributeDef<number>;
};

export const tradingReceivedQuotesEvent: EventDef<Attributes, EventType.TradingReceivedQuotes> = {
    name: EventType.TradingReceivedQuotes,
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
