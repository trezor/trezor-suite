import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type TradingCompareOffersEventType = 'exchange' | 'buy' | 'sell';

type Attributes = {
    type: AttributeDef<TradingCompareOffersEventType>;
};

// @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
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
