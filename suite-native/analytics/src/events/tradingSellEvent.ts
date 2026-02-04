import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';
import type { TradingSellAction, TradingSellStep } from '../definitions';

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
    descriptionTrigger: '?',
    changelog: [{ version: '?', notes: 'added' }],
    attributes: {
        action: { changelog: [{ version: '?', notes: 'added' }] },
        step: { changelog: [{ version: '?', notes: 'added' }] },
        cryptoLabel: { changelog: [{ version: '?', notes: 'added' }] },
        cryptoNetworkSymbol: { changelog: [{ version: '?', notes: 'added' }] },
        cryptoContractAddress: { changelog: [{ version: '?', notes: 'added' }] },
        receiveMethod: { changelog: [{ version: '?', notes: 'added' }] },
        countryOfResidence: { changelog: [{ version: '?', notes: 'added' }] },
        exchangeName: { changelog: [{ version: '?', notes: 'added' }] },
    },
};
