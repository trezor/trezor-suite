import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    type: AttributeDef<'buy' | 'sell' | 'swap'>;
    limit: AttributeDef<'min' | 'max'>;
    amountType: AttributeDef<'crypto' | 'fiat'>;
};

export const tradingAmountLimitFillEvent: EventDef<Attributes, EventType.TradingAmountLimitFill> = {
    name: EventType.TradingAmountLimitFill,
    descriptionTrigger:
        'Fired when user clicks the minimum or maximum amount limit shown in the buy/sell/swap form to fill it into the amount field',
    changelog: [{ version: '26.12.0', notes: 'added' }],

    attributes: {
        type: {
            changelog: [{ version: '26.12.0', notes: 'added' }],
            description: 'Trade type of the form: `buy` | `sell` | `swap`',
        },
        limit: {
            changelog: [{ version: '26.12.0', notes: 'added' }],
            description: 'Limit that was filled: `min` | `max`',
        },
        amountType: {
            changelog: [{ version: '26.12.0', notes: 'added' }],
            description: 'Amount field the limit was filled into: `crypto` | `fiat`',
        },
    },
};
