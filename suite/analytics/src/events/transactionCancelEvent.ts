import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    txType?: AttributeDef<'trade' | 'stake'>;
    networkSymbol: AttributeDef<string>;
};

export const transactionCancelEvent: EventDef<Attributes, EventType.TransactionCancel> = {
    name: EventType.TransactionCancel,
    descriptionTrigger: 'User cancels a transaction before confirming it on the device',
    changelog: [{ version: '25.4.0', notes: 'added' }],

    attributes: {
        txType: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
            description:
                'Type of transaction being cancelled: `trade` for trading transactions, `stake` for staking transactions',
        },
        networkSymbol: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
            description:
                'The blockchain network symbol of the transaction being cancelled (e.g., `btc`, `eth`)',
        },
    },
};
