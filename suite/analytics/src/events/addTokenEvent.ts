import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    networkSymbol: AttributeDef<string>;
    addedNth: AttributeDef<number>;
    token: AttributeDef<string>;
};

export const addTokenEvent: EventDef<Attributes, EventType.AddToken> = {
    name: EventType.AddToken,
    descriptionTrigger: 'Accounts > Ethereum account > ... > Add token',
    possibleImprovements: 'Rename to accounts/add-token',
    changelog: [{ version: '1.6.0', notes: 'added' }],

    attributes: {
        networkSymbol: {
            changelog: [{ version: '1.6.0', notes: 'added' }],
        },
        addedNth: {
            changelog: [{ version: '1.6.0', notes: 'added' }],
            description: 'if the user added 1st, 2nd,... token in his account',
        },
        token: {
            changelog: [{ version: '1.9.0', notes: 'added' }],
        },
    },
};
