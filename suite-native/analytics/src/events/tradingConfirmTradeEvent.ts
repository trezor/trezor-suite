import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { TradingType } from '@suite-common/trading';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<TradingType>;
};

export const tradingConfirmTradeEvent: EventDef<Attributes, EventType.TradingConfirmTrade> = {
    name: EventType.TradingConfirmTrade,
    descriptionTrigger: 'User confirms trade in trading flow.',
    changelog: [{ version: '1.0.0', notes: 'added' }],
    attributes: {
        type: { changelog: [{ version: '1.0.0', notes: 'added' }] },
    },
};
