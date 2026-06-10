import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const transactionDetailCompareValuesEvent: EventDef<
    Attributes,
    EventType.TransactionDetailCompareValues
> = {
    name: EventType.TransactionDetailCompareValues,
    descriptionTrigger:
        'User opens the Transaction detail Compare values sheet to view and compare transaction amounts in different formats',
    changelog: [{ version: '23.4.1', notes: 'added' }],
    attributes: {},
};
