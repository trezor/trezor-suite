import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    networkSymbol: AttributeDef<string>;
};

export const sendRawTransactionEvent: EventDef<Attributes, EventType.SendRawTransaction> = {
    name: EventType.SendRawTransaction,
    descriptionTrigger: 'Accounts > Send > ... > Send raw > Send',
    changelog: [{ version: '1.0.0', notes: 'added' }],

    attributes: {
        networkSymbol: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
    },
};
