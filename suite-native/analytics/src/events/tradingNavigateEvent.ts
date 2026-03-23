import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type TradingType } from '@suite-common/trading';

import { EventType } from '../constants';
import { type TradingNavigateFrom } from '../definitions';

type TradingNavigateAction = 'navigate' | 'cancel';

type Attributes = {
    action: AttributeDef<TradingNavigateAction>;
    type: AttributeDef<TradingType>;
    from: AttributeDef<TradingNavigateFrom>;
    networkSymbol?: AttributeDef<string>;
    contractAddress?: AttributeDef<string>;
};

export const tradingNavigateEvent: EventDef<Attributes, EventType.TradingNavigate> = {
    name: EventType.TradingNavigate,
    descriptionTrigger:
        'Navigation from other place to trading happens, entry point of trade flow.',
    changelog: [{ version: '25.5.1', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Action type: `navigate` | `cancel`',
        },
        type: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Type of trade',
        },
        from: {
            changelog: [
                { version: '25.5.1', notes: 'added' },
                {
                    version: '25.10.1',
                    notes: 'Added `trade/buy` | `trade/sell` | `trade/exchange` values',
                },
            ],
            description: 'From where is the navigation triggered',
        },
        networkSymbol: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
        },
        contractAddress: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
        },
    },
};
