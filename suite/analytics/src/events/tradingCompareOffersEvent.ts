import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type TradingCompareOffersEventType = 'exchange' | 'buy' | 'sell';

type Attributes = {
    type: AttributeDef<TradingCompareOffersEventType>;
};

export const tradingCompareOffersEvent: EventDef<Attributes, EventType.TradingCompareOffers> = {
    name: EventType.TradingCompareOffers,
    descriptionTrigger: '?',
    changelog: [{ version: '?', notes: 'added' }],

    attributes: {
        type: {
            changelog: [{ version: '?', notes: 'added' }],
        },
    },
};
