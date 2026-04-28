import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const transactionDetailInputOutputEvent: EventDef<
    Attributes,
    EventType.TransactionDetailInputOutput
> = {
    name: EventType.TransactionDetailInputOutput,
    descriptionTrigger: 'On opening Transaction detail Inputs & Outputs sheet.',
    changelog: [{ version: '23.4.1', notes: 'added' }],
    attributes: {},
};
