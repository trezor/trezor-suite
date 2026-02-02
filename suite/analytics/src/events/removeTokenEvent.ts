import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    networkSymbol: AttributeDef<string>;
    token: AttributeDef<string>;
};

export const removeTokenEvent: EventDef<Attributes, EventType.RemoveToken> = {
    name: EventType.RemoveToken,
    descriptionTrigger: '?',
    changelog: [{ version: '?', notes: 'added' }],

    attributes: {
        networkSymbol: {
            changelog: [{ version: '?', notes: 'added' }],
        },
        token: {
            changelog: [{ version: '?', notes: 'added' }],
        },
    },
};
