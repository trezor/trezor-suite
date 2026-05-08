import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<'continue' | 'cancel'>;
    step: AttributeDef<'buy-form'>;

    cryptoLabel?: AttributeDef<string>;
    cryptoNetworkSymbol?: AttributeDef<string>;
    cryptoContractAddress?: AttributeDef<string>;

    paymentMethod?: AttributeDef<string>;
    countryOfResidence?: AttributeDef<string>;

    exchangeName?: AttributeDef<string>;
};

export const tradeBuyEvent: EventDef<Attributes, EventType.TradeBuy> = {
    name: EventType.TradeBuy,
    descriptionTrigger: 'fired on every step during the buy flow',
    changelog: [{ version: '25.5.0', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '25.5.0', notes: 'added' }],
        },
        step: {
            changelog: [
                { version: '25.5.0', notes: 'added' },
                { version: '26.6.1', notes: 'removed `offers-form` value' },
            ],
        },
        cryptoLabel: {
            description: 'e.g. `BTC`, `ETH`, `SOL` etc.',
            changelog: [{ version: '25.5.0', notes: 'added' }],
        },
        cryptoNetworkSymbol: {
            description: 'symbol of the crypto, e.g. `btc`, `eth`, `sol` etc.',
            changelog: [{ version: '25.5.0', notes: 'added' }],
        },
        cryptoContractAddress: {
            description: 'contract address of the crypto (if it is a token)',
            changelog: [{ version: '25.5.0', notes: 'added' }],
        },
        paymentMethod: {
            description: "payment method, e.g. `creditCard` or 'bankTransfer'",
            changelog: [{ version: '25.5.0', notes: 'added' }],
        },
        countryOfResidence: {
            description: 'country of residence, e.g. `CZ` or `US`',
            changelog: [{ version: '25.5.0', notes: 'added' }],
        },
        exchangeName: {
            description: 'name of the exchange, e.g. `moonpay`',
            changelog: [{ version: '25.5.0', notes: 'added' }],
        },
    },
};
