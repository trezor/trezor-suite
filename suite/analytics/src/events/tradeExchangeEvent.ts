import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<'continue' | 'cancel'>;
    step: AttributeDef<
        | 'exchange-form'
        | 'receive-address'
        | 'create-approval'
        | 'already-approved'
        | 'confirm-and-send'
    >;

    sendCryptoLabel?: AttributeDef<string>;
    sendCryptoNetworkSymbol?: AttributeDef<string>;
    sendCryptoContractAddress?: AttributeDef<string>;

    receiveCryptoLabel?: AttributeDef<string>;
    receiveCryptoNetworkSymbol?: AttributeDef<string>;
    receiveCryptoContractAddress?: AttributeDef<string>;

    exchangeName?: AttributeDef<string>;
    exchangeType?: AttributeDef<string>;

    fractionButton?: AttributeDef<string>;
    accountType?: AttributeDef<string>;
    approvalType?: AttributeDef<string>;
    slippage?: AttributeDef<string>;
    rateType?: AttributeDef<string>;
};

export const tradeExchangeEvent: EventDef<Attributes, EventType.TradeExchange> = {
    name: EventType.TradeExchange,
    descriptionTrigger: 'fired on every step during the exchange flow',
    changelog: [{ version: '25.5.2', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '25.5.2', notes: 'added' }],
        },
        step: {
            changelog: [
                { version: '25.5.2', notes: 'added' },
                { version: '26.6.1', notes: 'removed `offers-form` value' },
            ],
        },
        sendCryptoLabel: {
            changelog: [{ version: '25.5.2', notes: 'added' }],
            description: 'label of the ‘From’ crypto, e.g. ‘BTC’, ‘ETH’, ‘SOL’ etc.',
        },
        sendCryptoNetworkSymbol: {
            changelog: [{ version: '25.5.2', notes: 'added' }],
            description: 'symbol of the ‘From’ crypto, e.g. ‘btc’, ‘eth’, ‘sol’ etc.',
        },
        sendCryptoContractAddress: {
            changelog: [{ version: '25.5.2', notes: 'added' }],
            description: 'contract address of the ‘From’ crypto (if it is a token)',
        },
        receiveCryptoLabel: {
            changelog: [{ version: '25.5.2', notes: 'added' }],
            description: 'label of the ‘To’ crypto, e.g. ‘BTC’, ‘ETH’, ‘SOL’ etc.',
        },
        receiveCryptoNetworkSymbol: {
            changelog: [{ version: '25.5.2', notes: 'added' }],
            description: 'symbol of the ‘To’ crypto, e.g. ‘btc’, ‘eth’, ‘sol’ etc.',
        },
        receiveCryptoContractAddress: {
            changelog: [{ version: '25.5.2', notes: 'added' }],
            description: 'contract address of the ‘From’ crypto (if it is a token)',
        },
        exchangeName: {
            changelog: [{ version: '25.5.2', notes: 'added' }],
            description: 'name of the exchange, e.g. ‘moonpay’',
        },
        exchangeType: {
            changelog: [{ version: '25.5.2', notes: 'added' }],
            description: '‘CEX’ or ‘DEX’',
        },
        fractionButton: {
            changelog: [{ version: '25.5.2', notes: 'added' }],
            description: 'e.g. ‘10%’, ‘50%’ (if the user used the provided fraction button)',
        },
        accountType: {
            changelog: [{ version: '25.5.2', notes: 'added' }],
            description: '`SUITE` or `ADD_SUITE` or `NON_SUITE`',
        },
        approvalType: {
            changelog: [{ version: '25.5.2', notes: 'added' }],
            description: '`MINIMAL` | `INFINITE` | `ZERO` | `PRESET`',
        },
        slippage: {
            changelog: [{ version: '25.5.2', notes: 'added' }],
            description: 'e.g. `0.1`, `0.5`, `2`,…',
        },
        rateType: {
            changelog: [{ version: '25.5.2', notes: 'added' }],
            description: '`fixed` or `floating`',
        },
    },
};
