import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<'navigate' | 'cancel'>;
    type: AttributeDef<'exchange' | 'buy' | 'sell' | 'buy/sell' | 'concierge'>;
    from: AttributeDef<
        | 'dashboard/header'
        | 'dashboard/assets'
        | 'dashboard/empty-wallet'
        | 'dashboard/staking-dashboard'
        | 'earn-dashboard'
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
    descriptionTrigger:
        'User navigates from a trading action button to the trading form for buy/sell/exchange',
    changelog: [{ version: '25.5.2', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '25.5.2', notes: 'added' }],
            description:
                '`navigate` when user proceeds to trading form, `cancel` when user cancels the navigation',
        },
        type: {
            changelog: [{ version: '25.5.2', notes: 'added' }],
            description:
                'Type of trading action: `exchange` for swapping, `buy` for purchasing crypto, `sell` for selling crypto, `buy/sell` for combined actions, `concierge` for assisted trading',
        },
        from: {
            changelog: [
                { version: '25.5.2', notes: 'added' },
                { version: '26.3.0', notes: 'added `dashboard/empty-wallet` value' },
                { version: '26.5.2', notes: 'added `earn-dashboard` value' },
            ],
            description:
                'Location where the user initiated the trading action (e.g., `dashboard/header`, `account/tradebox`, `dashboard/assets`)',
        },
        networkSymbol: {
            changelog: [{ version: '25.5.2', notes: 'added' }],
            description:
                'The blockchain network symbol for the trading action (e.g., `btc`, `eth`)',
        },
        contractAddress: {
            changelog: [{ version: '25.5.2', notes: 'added' }],
            description: 'The contract address for token-specific trading actions',
        },
    },
};
