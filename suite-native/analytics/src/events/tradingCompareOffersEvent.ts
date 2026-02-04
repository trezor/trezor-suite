import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { TradingType } from '@suite-common/trading';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<TradingType>;
};

export const tradingCompareOffersEvent: EventDef<Attributes, EventType.TradingCompareOffers> = {
    name: EventType.TradingCompareOffers,
    descriptionTrigger: 'User clicked providers to see all quotes, after quote is received',
    changelog: [{ version: '25.5.1', notes: 'Added' }],
    attributes: {
        type: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description:
                '`buy`/`sell`/`exchange` - set via trade form; `settings` - set via settings (currently on iOS only); `onboarding` - set via initial app onboarding or after user updated the app',
        },
    },
};
