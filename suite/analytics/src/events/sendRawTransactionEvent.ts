import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    networkSymbol: AttributeDef<string>;
};

export const sendRawTransactionEvent: EventDef<Attributes, EventType.SendRawTransaction> = {
    name: EventType.SendRawTransaction,
    descriptionTrigger:
        'User sends a raw transaction by navigating through Accounts > Send > Send raw and confirming the transaction',
    changelog: [{ version: '1.0.0', notes: 'added' }],

    attributes: {
        networkSymbol: {
            description:
                'The blockchain network symbol where the raw transaction is being sent (e.g., `eth`, `etc`)',
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
    },
};
