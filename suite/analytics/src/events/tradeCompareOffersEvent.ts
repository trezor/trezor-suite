import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type TradingCompareOffersEventType = 'exchange' | 'buy' | 'sell';

type Attributes = {
    type: AttributeDef<TradingCompareOffersEventType>;
};

export const tradeCompareOffersEvent: EventDef<Attributes, EventType.TradeCompareOffers> = {
    name: EventType.TradeCompareOffers,
    descriptionTrigger: 'User compares multiple trading offers from different providers',
    changelog: [{ version: '25.9.1', notes: 'added' }],

    attributes: {
        type: {
            description:
                'The type of trading comparison: `exchange` for exchange offers, `buy` for buy offers, `sell` for sell offers',
            changelog: [{ version: '25.9.1', notes: 'added' }],
        },
    },
};
