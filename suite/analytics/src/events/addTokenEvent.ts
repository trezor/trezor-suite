import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    networkSymbol: AttributeDef<string>;
    addedNth: AttributeDef<number>;
    token: AttributeDef<string>;
};

export const addTokenEvent: EventDef<Attributes, EventType.AddToken> = {
    name: EventType.AddToken,
    descriptionTrigger:
        'User adds a custom token to their Ethereum account via the account menu (Accounts > Select Ethereum account > ... > Add token)',
    possibleImprovements: 'Rename to accounts/add-token',
    changelog: [{ version: '1.6.0', notes: 'added' }],

    attributes: {
        networkSymbol: {
            description:
                'The blockchain network symbol of the account where the token is being added',
            changelog: [{ version: '1.6.0', notes: 'added' }],
        },
        addedNth: {
            changelog: [{ version: '1.6.0', notes: 'added' }],
            description: 'if the user added 1st, 2nd,... token in his account',
        },
        token: {
            description:
                'Identifier of the token being added (token symbol for EVM networks, contract address for Stellar)',
            changelog: [
                { version: '1.9.0', notes: 'added' },
                {
                    version: '26.9.0',
                    notes: 'no longer lowercased, reports the exact casing returned by the blockchain backend',
                },
            ],
        },
    },
};
