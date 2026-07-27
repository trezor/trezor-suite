import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';
import { type TradingSellAction, type TradingSellStep } from '../definitions';

type Attributes = {
    action: AttributeDef<TradingSellAction>;
    step: AttributeDef<TradingSellStep>;
    cryptoLabel?: AttributeDef<string>;
    cryptoNetworkSymbol?: AttributeDef<string>;
    cryptoContractAddress?: AttributeDef<string>;
    receiveMethod?: AttributeDef<string>;
    countryOfResidence?: AttributeDef<string>;
    exchangeName?: AttributeDef<string>;
};

export const tradingSellEvent: EventDef<Attributes, EventType.TradingSell> = {
    name: EventType.TradingSell,
    descriptionTrigger:
        'User navigates through the cryptocurrency sell transaction flow, with tracking at each action and step',
    changelog: [{ version: '25.5.1', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'User action: `continue`, `cancel`, `retry`, or `visit`',
        },
        step: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Current step in the sell flow where the action occurred',
        },
        cryptoLabel: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description:
                'Display label of the cryptocurrency being sold (e.g., `BTC`, `ETH`, `SOL`)',
        },
        cryptoNetworkSymbol: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'The blockchain network symbol (e.g., `btc`, `eth`, `ada`)',
        },
        cryptoContractAddress: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Contract address of the token being sold (only for token sales)',
        },
        receiveMethod: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description:
                'The method for receiving funds from the sale (e.g., `bankTransfer`, `paypal`)',
        },
        countryOfResidence: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description:
                "Country code of the user's residence for compliance and service availability",
        },
        exchangeName: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Name of the exchange platform handling the sell transaction',
        },
    },
};
