import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';
import { type TradingExchangeAction, type TradingExchangeStep } from '../definitions';

type Attributes = {
    action: AttributeDef<TradingExchangeAction>;
    step: AttributeDef<TradingExchangeStep>;
    sendCryptoLabel?: AttributeDef<string>;
    sendCryptoNetworkSymbol?: AttributeDef<string>;
    sendCryptoContractAddress?: AttributeDef<string>;
    receiveCryptoLabel?: AttributeDef<string>;
    receiveCryptoNetworkSymbol?: AttributeDef<string>;
    receiveCryptoContractAddress?: AttributeDef<string>;
    exchangeName?: AttributeDef<string>;
    exchangeType?: AttributeDef<string>;
    accountType?: AttributeDef<string>;
    approvalType?: AttributeDef<string>;
    slippage?: AttributeDef<string>;
    rateType?: AttributeDef<string>;
};

export const tradingExchangeEvent: EventDef<Attributes, EventType.TradingExchange> = {
    name: EventType.TradingExchange,
    descriptionTrigger:
        'User navigates through the cryptocurrency exchange (swap) transaction flow, with tracking at each action and step',
    changelog: [{ version: '25.10.1', notes: 'added' }],

    attributes: {
        action: {
            changelog: [
                { version: '25.10.1', notes: 'added' },
                { version: '26.6.1', notes: 'modified' },
            ],
            description:
                'Action type: `continue` | `cancel` | `retry` | `visit` | `revoke` | `value_change`',
        },
        step: {
            changelog: [
                { version: '25.10.1', notes: 'added' },
                { version: '26.6.1', notes: 'modified' },
            ],
            description: 'Current step in the exchange flow',
        },
        sendCryptoLabel: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
            description:
                'Display label of the cryptocurrency being sent in the exchange (e.g., `BTC`, `ETH`, `SOL`)',
        },
        sendCryptoNetworkSymbol: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
            description:
                'The blockchain network symbol of the cryptocurrency being sent (e.g., `btc`, `eth`, `ada`)',
        },
        sendCryptoContractAddress: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
            description: 'Contract address of the token being sent (only for token exchanges)',
        },
        receiveCryptoLabel: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
            description:
                'Display label of the cryptocurrency being received in the exchange (e.g., `BTC`, `ETH`, `SOL`)',
        },
        receiveCryptoNetworkSymbol: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
            description:
                'The blockchain network symbol of the cryptocurrency being received (e.g., `btc`, `eth`, `ada`)',
        },
        receiveCryptoContractAddress: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
            description: 'Contract address of the token being received (only for token exchanges)',
        },
        exchangeName: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
            description:
                'Name of the exchange platform handling the swap transaction (e.g., `changelly`, `invity`)',
        },
        exchangeType: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
            description:
                'Exchange type: `CEX` for centralized exchange, `DEX` for decentralized exchange',
        },
        accountType: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
            description: 'Type of account used for the exchange',
        },
        approvalType: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
            description: 'Type of approval required for the exchange (e.g., `MINIMAL`)',
        },
        slippage: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
            description:
                'Slippage tolerance percentage for the exchange rate (e.g., `0.5`, `1.0`, `2.0`)',
        },
        rateType: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
            description:
                'Rate type: `fixed` for guaranteed rate, `floating` for market rate that may change',
        },
    },
};
