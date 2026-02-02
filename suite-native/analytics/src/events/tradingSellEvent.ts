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
    descriptionTrigger: 'User interacts with sell flow (continue, cancel, retry, visit).',
    changelog: [{ version: '1.0.0', notes: 'added' }],
    attributes: {
        action: { changelog: [{ version: '1.0.0', notes: 'added' }] },
        step: { changelog: [{ version: '1.0.0', notes: 'added' }] },
        cryptoLabel: { changelog: [{ version: '1.0.0', notes: 'added' }] },
        cryptoNetworkSymbol: { changelog: [{ version: '1.0.0', notes: 'added' }] },
        cryptoContractAddress: { changelog: [{ version: '1.0.0', notes: 'added' }] },
        receiveMethod: { changelog: [{ version: '1.0.0', notes: 'added' }] },
        countryOfResidence: { changelog: [{ version: '1.0.0', notes: 'added' }] },
        exchangeName: { changelog: [{ version: '1.0.0', notes: 'added' }] },
    },
};
