import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const transactionDetailInputOutputEvent: EventDef<
    undefined,
    EventType.TransactionDetailInputOutput
> = {
    name: EventType.TransactionDetailInputOutput,
    descriptionTrigger: 'On transaction detail input/output tab opening',
    changelog: [{ version: '23.4.1', notes: 'added' }],
};
