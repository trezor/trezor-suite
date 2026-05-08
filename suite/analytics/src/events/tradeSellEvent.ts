import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<'continue' | 'cancel'>;
    step: AttributeDef<'sell-form' | 'confirm-and-send-transaction'>;

    cryptoLabel?: AttributeDef<string>;
    cryptoNetworkSymbol?: AttributeDef<string>;
    cryptoContractAddress?: AttributeDef<string>;

    receiveMethod?: AttributeDef<string>;
    countryOfResidence?: AttributeDef<string>;

    exchangeName?: AttributeDef<string>;
    fractionButton?: AttributeDef<string>;
};

export const tradeSellEvent: EventDef<Attributes, EventType.TradeSell> = {
    name: EventType.TradeSell,
    descriptionTrigger: 'fired on every step during the sell flow',
    changelog: [{ version: '25.5.2', notes: 'added' }],

    attributes: {
        action: {
            description: '`continue` or `cancel`',
            changelog: [{ version: '25.5.2', notes: 'added' }],
        },
        step: {
            description:
                'sell flow step: `sell-form` | `sell-terms-modal` | `confirm-and-send-transaction` | `status-pending` | `status-success` | `status-error`',
            changelog: [
                { version: '25.5.2', notes: 'added' },
                { version: '26.6.1', notes: 'removed `offers-form` value' },
            ],
        },
        cryptoLabel: {
            description: 'e.g. `BTC`, `ETH`, `SOL` etc.',
            changelog: [{ version: '25.5.2', notes: 'added' }],
        },
        cryptoNetworkSymbol: {
            description: 'symbol of the crypto, e.g. `btc`, `eth`, `sol` etc.',
            changelog: [{ version: '25.5.2', notes: 'added' }],
        },
        cryptoContractAddress: {
            description: 'contract address of the crypto (if it is a token)',
            changelog: [{ version: '25.5.2', notes: 'added' }],
        },
        receiveMethod: {
            description: 'receive method, e.g. `creditCard` or `SEPA`',
            changelog: [{ version: '25.5.2', notes: 'added' }],
        },
        countryOfResidence: {
            description: 'country of residence, e.g. `CZ` or `US`',
            changelog: [{ version: '25.5.2', notes: 'added' }],
        },
        exchangeName: {
            description: 'name of the exchange, e.g. `moonpay`',
            changelog: [{ version: '25.5.2', notes: 'added' }],
        },
        fractionButton: {
            description: 'e.g. `10%`, `50%` (if the user used the provided fraction button)',
            changelog: [{ version: '25.5.2', notes: 'added' }],
        },
    },
};
