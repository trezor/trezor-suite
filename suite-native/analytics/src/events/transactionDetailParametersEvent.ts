import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {};

export const transactionDetailParametersEvent: EventDef<
    Attributes,
    // @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
    EventType.TransactionDetailParameters
> = {
    name: EventType.TransactionDetailParameters,
    descriptionTrigger: 'On opening Transaction detail Parameters sheet.',
    changelog: [{ version: '23.4.1', notes: 'added' }],
    attributes: {},
};
