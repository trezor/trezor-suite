import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type TradingType } from '@suite-common/trading';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<TradingType>;
};

export const tradingSuccessEvent: EventDef<Attributes, EventType.TradingSuccess> = {
    name: EventType.TradingSuccess,
    descriptionTrigger: 'User was sent to trade detail.',
    changelog: [{ version: '25.5.1', notes: 'added' }],

    attributes: {
        type: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Type of trade.',
        },
    },
};
