import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type TradingType } from '@suite-common/trading';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<TradingType>;
};

export const tradingCompareOffersEvent: EventDef<Attributes, EventType.TradingCompareOffers> = {
    name: EventType.TradingCompareOffers,
    descriptionTrigger:
        'User clicks to view all available exchange provider quotes after trading quotes are received',
    changelog: [{ version: '25.5.1', notes: 'added' }],

    attributes: {
        type: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description:
                'Type of trade: `buy` for purchase, `sell` for selling cryptocurrency, `exchange` for swapping',
        },
    },
};
