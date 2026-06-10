import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type TradingType } from '@suite-common/trading';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<TradingType>;
};

export const tradingQuoteReceivedEvent: EventDef<Attributes, EventType.TradingQuoteReceived> = {
    name: EventType.TradingQuoteReceived,
    descriptionTrigger:
        'Trading quotes are received from the exchange API and all available offers are collected for display to the user',
    changelog: [{ version: '25.5.1', notes: 'added' }],

    attributes: {
        type: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description:
                'Type of trading operation: `buy` for purchasing cryptocurrency, `sell` for selling cryptocurrency, `exchange` for swapping between cryptocurrencies',
        },
    },
};
