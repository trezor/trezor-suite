import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const transactionDetailCompareValuesEvent: EventDef<
    Attributes,
    EventType.TransactionDetailCompareValues
> = {
    name: EventType.TransactionDetailCompareValues,
    descriptionTrigger: 'On opening Transaction detail Compare values sheet.',
    changelog: [{ version: '23.4.1', notes: 'added' }],
    attributes: {},
};
