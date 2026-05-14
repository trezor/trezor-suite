import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type TradingType } from '@suite-common/trading';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<TradingType>;
};

export const tradingConfirmTradeEvent: EventDef<Attributes, EventType.TradingConfirmTrade> = {
    name: EventType.TradingConfirmTrade,
    descriptionTrigger: 'User confirmed quote (clicked continue).',
    changelog: [{ version: '25.5.1', notes: 'added' }],

    attributes: {
        type: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Type of trade: `buy` | `sell` | `exchange`',
        },
    },
};
