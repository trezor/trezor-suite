import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    networkSymbol: AttributeDef<string>;
    token: AttributeDef<string>;
};

export const removeTokenEvent: EventDef<Attributes, EventType.RemoveToken> = {
    name: EventType.RemoveToken,
    descriptionTrigger: 'User removes a custom token or hides a token from their portfolio',
    changelog: [{ version: '25.12.1', notes: 'added' }],

    attributes: {
        networkSymbol: {
            description: 'The blockchain network symbol of the account where the token exists',
            changelog: [{ version: '25.12.1', notes: 'added' }],
        },
        token: {
            description: 'The contract address of the token being removed',
            changelog: [{ version: '25.12.1', notes: 'added' }],
        },
    },
};
