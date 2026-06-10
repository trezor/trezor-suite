import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type TradingType } from '@suite-common/trading';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<TradingType>;
};

export const tradingSuccessEvent: EventDef<Attributes, EventType.TradingSuccess> = {
    name: EventType.TradingSuccess,
    descriptionTrigger:
        'A trading transaction (buy/sell/exchange) completes successfully and the user is navigated to the trade detail view',
    changelog: [{ version: '25.5.1', notes: 'added' }],

    attributes: {
        type: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description:
                'Type of trade: `buy` for purchase, `sell` for selling cryptocurrency, `exchange` for swapping between cryptocurrencies',
        },
    },
};
