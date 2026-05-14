import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type TradingType } from '@suite-common/trading';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<TradingType>;
};

export const tradingQuoteReceivedEvent: EventDef<Attributes, EventType.TradingQuoteReceived> = {
    name: EventType.TradingQuoteReceived,
    descriptionTrigger: 'User received quotes from api (suite has all offers collected).',
    changelog: [{ version: '25.5.1', notes: 'added' }],

    attributes: {
        type: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Trading type (`buy` | `sell` | `exchange`)',
        },
    },
};
