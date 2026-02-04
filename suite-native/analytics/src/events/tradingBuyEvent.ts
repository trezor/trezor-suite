import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type TradingBuyAction = 'continue' | 'cancel';
export type TradingBuyStep = 'buy-form' | 'account-selection';

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
    descriptionTrigger: 'Actions related to buy flow, before `confirm_trade`',
    changelog: [{ version: '25.5.1', notes: 'Added' }],
    attributes: {
        action: { changelog: [{ version: '25.5.1', notes: 'added' }] },
        step: { changelog: [{ version: '25.5.1', notes: 'added' }] },
        cryptoLabel: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'What asset is traded',
        },
        cryptoNetworkSymbol: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'What network the asset is on',
        },
        cryptoContractAddress: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Contract of traded asset',
        },
        paymentMethod: { changelog: [{ version: '25.5.1', notes: 'added' }] },
        countryOfResidence: { changelog: [{ version: '25.5.1', notes: 'added' }] },
        exchangeName: { changelog: [{ version: '25.5.1', notes: 'added' }] },
    },
};
