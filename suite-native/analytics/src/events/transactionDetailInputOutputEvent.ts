import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const transactionDetailInputOutputEvent: EventDef<
    Attributes,
    EventType.TransactionDetailInputOutput
> = {
    name: EventType.TransactionDetailInputOutput,
    descriptionTrigger:
        'User opens the Transaction detail Inputs & Outputs sheet to view transaction inputs and outputs',
    changelog: [{ version: '23.4.1', notes: 'added' }],
    attributes: {},
};
