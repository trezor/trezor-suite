import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';
import type { TradingBuyAction, TradingBuyStep } from '../definitions';

type Attributes = {
    action: AttributeDef<TradingBuyAction>;
    step: AttributeDef<TradingBuyStep>;
    cryptoLabel?: AttributeDef<string>;
    cryptoNetworkSymbol?: AttributeDef<string>;
    cryptoContractAddress?: AttributeDef<string>;
    paymentMethod?: AttributeDef<string>;
    countryOfResidence?: AttributeDef<string>;
    exchangeName?: AttributeDef<string>;
};

export const tradingBuyEvent: EventDef<Attributes, EventType.TradingBuy> = {
    name: EventType.TradingBuy,
    descriptionTrigger:
        'User navigates through the cryptocurrency buy transaction flow, with tracking at each action and step',
    changelog: [{ version: '25.5.1', notes: 'added' }],

    attributes: {
        action: {
            changelog: [
                { version: '25.5.1', notes: 'added' },
                { version: '26.7.1', notes: 'added `visit` value' },
            ],
            description:
                'User action: `continue` to proceed through the flow, `cancel` to exit, `visit` on screen mount',
        },
        step: {
            changelog: [
                { version: '25.5.1', notes: 'added' },
                { version: '26.7.1', notes: 'added `buy-preview` value' },
            ],
            description:
                'Current step in the buy flow: `buy-form` for initial form, `account-selection` for choosing account to buy to, `buy-preview` for the preview screen',
        },
        cryptoLabel: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description:
                'Display label of the cryptocurrency being purchased (e.g., `BTC`, `ETH`, `SOL`)',
        },
        cryptoNetworkSymbol: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'The blockchain network symbol (e.g., `btc`, `eth`, `ada`)',
        },
        cryptoContractAddress: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Contract address of the token being purchased (only for token purchases)',
        },
        paymentMethod: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description:
                'Payment method selected for the purchase (e.g., `creditCard`, `bankTransfer`)',
        },
        countryOfResidence: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: "Country code of the buyer's residence (e.g., `US`, `CZ`, `DE`)",
        },
        exchangeName: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description:
                'Name of the exchange/provider processing the buy order (e.g., `moonpay`, `invity`)',
        },
    },
};
