import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {};

export const transactionDetailExploreInBlockchainEvent: EventDef<
    Attributes,
    // @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
    EventType.TransactionDetailExploreInBlockchain
> = {
    name: EventType.TransactionDetailExploreInBlockchain,
    descriptionTrigger: 'On click on Explore in blockchain button.',
    changelog: [{ version: '23.4.1', notes: 'added' }],
    attributes: {},
};
