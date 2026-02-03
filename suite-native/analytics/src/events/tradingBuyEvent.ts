import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type TradingBuyAction = 'continue' | 'cancel';
type TradingBuyStep = 'buy-form' | 'account-selection';

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
    descriptionTrigger: 'Actions related to buy flow, before confirm_trade.',
    changelog: [{ version: '25.5.1', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Action type',
        },
        step: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Current step in the buy flow',
        },
        cryptoLabel: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
        },
        cryptoNetworkSymbol: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
        },
        cryptoContractAddress: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
        },
        paymentMethod: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
        },
        countryOfResidence: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
        },
        exchangeName: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
        },
    },
};
