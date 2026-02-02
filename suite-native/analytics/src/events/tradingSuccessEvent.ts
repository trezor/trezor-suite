import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { TradingType } from '@suite-common/trading';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<TradingType>;
};

export const tradingSuccessEvent: EventDef<Attributes, EventType.TradingSuccess> = {
    name: EventType.TradingSuccess,
    descriptionTrigger: 'Trading flow completed successfully.',
    changelog: [{ version: '1.0.0', notes: 'added' }],
    attributes: {
        type: { changelog: [{ version: '1.0.0', notes: 'added' }] },
    },
};
