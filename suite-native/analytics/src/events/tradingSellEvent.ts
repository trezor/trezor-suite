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
    descriptionTrigger: 'Actions related to sell flow, before confirm_trade.',
    changelog: [{ version: '25.5.1', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Action type',
        },
        step: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Current step in the sell flow',
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
        receiveMethod: {
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
