import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const transactionDetailParametersEvent: EventDef<
    undefined,
    EventType.TransactionDetailParameters
> = {
    name: EventType.TransactionDetailParameters,
    descriptionTrigger: 'On transaction detail parameters tab opening',
    changelog: [{ version: '23.4.1', notes: 'added' }],
};
