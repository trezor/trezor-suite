import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    networkSymbol: AttributeDef<string>;
    token: AttributeDef<string>;
};

export const removeTokenEvent: EventDef<Attributes, EventType.RemoveToken> = {
    name: EventType.RemoveToken,
    descriptionTrigger:
        'User removes/hides a token from their portfolio. Currently emitted only from the Stellar token management modal.',
    changelog: [{ version: '25.12.1', notes: 'added' }],

    attributes: {
        networkSymbol: {
            description: 'The blockchain network symbol of the account where the token exists',
            changelog: [{ version: '25.12.1', notes: 'added' }],
        },
        token: {
            description:
                'The identifier of the token being removed (Stellar token contract / code-issuer)',
            changelog: [{ version: '25.12.1', notes: 'added' }],
        },
    },
};
