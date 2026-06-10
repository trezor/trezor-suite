import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type TradingType } from '@suite-common/trading';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<TradingType>;
};

export const tradingConfirmTradeEvent: EventDef<Attributes, EventType.TradingConfirmTrade> = {
    name: EventType.TradingConfirmTrade,
    descriptionTrigger:
        'User confirms and accepts a trading quote by clicking continue to proceed with the transaction',
    changelog: [{ version: '25.5.1', notes: 'added' }],

    attributes: {
        type: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description:
                'Type of trade: `buy` for purchase, `sell` for selling cryptocurrency, `exchange` for swapping',
        },
    },
};
