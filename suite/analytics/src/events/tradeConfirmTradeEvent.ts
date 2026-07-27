import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<'buy' | 'sell' | 'exchange'>;
};

export const tradeConfirmTradeEvent: EventDef<Attributes, EventType.TradeConfirmTrade> = {
    name: EventType.TradeConfirmTrade,
    descriptionTrigger:
        'Fired on every `Finish transaction` click in the Trade section, regardless of the state of the response from the API.',
    changelog: [
        { version: '24.10.0', notes: 'added' },
        { version: '25.5.2', notes: 'updated' },
    ],

    attributes: {
        action: {
            changelog: [{ version: '24.10.0', notes: 'added' }],
            description:
                'The type of trading action being confirmed: `buy` for buying crypto, `sell` for selling crypto, `exchange` for exchanging between cryptocurrencies',
        },
    },
};
