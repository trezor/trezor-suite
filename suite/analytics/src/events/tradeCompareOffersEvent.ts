import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type TradingCompareOffersEventType = 'exchange' | 'buy' | 'sell';

type Attributes = {
    type: AttributeDef<TradingCompareOffersEventType>;
};

export const tradeCompareOffersEvent: EventDef<Attributes, EventType.TradeCompareOffers> = {
    name: EventType.TradeCompareOffers,
    descriptionTrigger: '?',
    changelog: [{ version: '?', notes: 'added' }],

    attributes: {
        type: {
            changelog: [{ version: '?', notes: 'added' }],
        },
    },
};
