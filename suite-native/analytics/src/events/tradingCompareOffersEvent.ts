import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type TradingType } from '@suite-common/trading';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<TradingType>;
};

export const tradingCompareOffersEvent: EventDef<Attributes, EventType.TradingCompareOffers> = {
    name: EventType.TradingCompareOffers,
    descriptionTrigger: 'User clicked providers to see all quotes, after quote is received.',
    changelog: [{ version: '25.5.1', notes: 'added' }],

    attributes: {
        type: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Type of trade',
        },
    },
};
