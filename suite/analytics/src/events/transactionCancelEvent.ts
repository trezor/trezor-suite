import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    txType?: AttributeDef<'trade' | 'stake'>;
    networkSymbol: AttributeDef<string>;
};

export const transactionCancelEvent: EventDef<Attributes, EventType.TransactionCancel> = {
    name: EventType.TransactionCancel,
    descriptionTrigger: 'fired when a transaction is cancelled by the user',
    changelog: [{ version: '25.4.0', notes: 'added' }],

    attributes: {
        txType: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
        },
        networkSymbol: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
        },
    },
};
