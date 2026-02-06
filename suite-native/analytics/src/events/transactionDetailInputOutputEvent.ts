import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {};

export const transactionDetailInputOutputEvent: EventDef<
    Attributes,
    // @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
    EventType.TransactionDetailInputOutput
> = {
    name: EventType.TransactionDetailInputOutput,
    descriptionTrigger: 'On opening Transaction detail Inputs & Outputs sheet.',
    changelog: [{ version: '23.4.1', notes: 'added' }],
    attributes: {},
};
