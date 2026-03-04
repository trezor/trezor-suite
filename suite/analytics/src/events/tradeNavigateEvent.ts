import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<'navigate' | 'cancel'>;
    type: AttributeDef<'exchange' | 'buy' | 'sell' | 'buy/sell' | 'concierge'>;
    from: AttributeDef<
        | 'dashboard/header'
        | 'dashboard/assets'
        | 'dashboard/staking-dashboard'
        | 'account/header'
        | 'account/tokens'
        | 'account/tradebox'
        | 'account/empty'
        | 'buy/sell'
    >;
    networkSymbol?: AttributeDef<string>;
    contractAddress?: AttributeDef<string>;
};

export const tradeNavigateEvent: EventDef<Attributes, EventType.TradeNavigate> = {
    name: EventType.TradeNavigate,
    descriptionTrigger: 'fired on navigating from any trading button to the trading forms',
    changelog: [{ version: '25.5.2', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '25.5.2', notes: 'added' }],
        },
        type: {
            changelog: [{ version: '25.5.2', notes: 'added' }],
        },
        from: {
            changelog: [{ version: '25.5.2', notes: 'added' }],
        },
        networkSymbol: {
            changelog: [{ version: '25.5.2', notes: 'added' }],
        },
        contractAddress: {
            changelog: [{ version: '25.5.2', notes: 'added' }],
        },
    },
};
