import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<'buy' | 'sell' | 'exchange'>;
};

export const tradeConfirmTradeEvent: EventDef<Attributes, EventType.TradingConfirmTrade> = {
    name: EventType.TradingConfirmTrade,
    descriptionTrigger:
        'Fired on every `Finish transaction` click in the Trade section, regardless of the state of the response from the API.',
    changelog: [
        { version: '24.10.0', notes: 'added' },
        { version: '25.5.2', notes: 'updated' },
    ],

    attributes: {
        action: {
            changelog: [{ version: '24.10.0', notes: 'added' }],
        },
    },
};
