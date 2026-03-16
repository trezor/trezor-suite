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
    descriptionTrigger: 'Actions related to exchange (swap).',
    changelog: [{ version: '25.10.1', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
            description: 'Action type: `continue` | `cancel` | `retry` | `visit`',
        },
        step: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
            description: 'Current step in the exchange flow',
        },
        sendCryptoLabel: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
        },
        sendCryptoNetworkSymbol: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
        },
        sendCryptoContractAddress: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
        },
        receiveCryptoLabel: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
        },
        receiveCryptoNetworkSymbol: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
        },
        receiveCryptoContractAddress: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
        },
        exchangeName: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
        },
        exchangeType: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
            description: 'Exchange type: `CEX` | `DEX`',
        },
        accountType: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
        },
        approvalType: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
        },
        slippage: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
        },
        rateType: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
            description: 'Rate type: `fixed` | `floating`',
        },
    },
};
