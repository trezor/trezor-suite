import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const transactionDetailParametersEvent: EventDef<
    Attributes,
    EventType.TransactionDetailParameters
> = {
    name: EventType.TransactionDetailParameters,
    descriptionTrigger:
        'User opens the Transaction detail Parameters sheet to view advanced transaction information',
    changelog: [{ version: '23.4.1', notes: 'added' }],
    attributes: {},
};
