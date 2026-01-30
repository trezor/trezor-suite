import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const transactionDetailCompareValuesEvent: EventDef<
    undefined,
    EventType.TransactionDetailCompareValues
> = {
    name: EventType.TransactionDetailCompareValues,
    descriptionTrigger: 'On transaction detail compare values tab opening',
    changelog: [{ version: '23.4.1', notes: 'added' }],
};
