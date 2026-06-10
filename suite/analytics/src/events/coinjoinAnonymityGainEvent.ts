import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    networkSymbol: AttributeDef<string>;
    value: AttributeDef<number>;
};

export const coinjoinAnonymityGainEvent: EventDef<Attributes, EventType.CoinjoinAnonymityGain> = {
    name: EventType.CoinjoinAnonymityGain,
    descriptionTrigger:
        'Coinjoin is paused/stopped and there is at least one coinjoin transaction that has not been reported yet',
    changelog: [{ version: '23.4.1', notes: 'added' }],

    attributes: {
        networkSymbol: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description:
                'The blockchain network symbol where coinjoin occurred (typically `btc` for Bitcoin)',
        },
        value: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'number (rounded to 3 decimals)',
        },
    },
};
