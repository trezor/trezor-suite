import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const transactionDetailExploreInBlockchainEvent: EventDef<
    Attributes,
    EventType.TransactionDetailExploreInBlockchain
> = {
    name: EventType.TransactionDetailExploreInBlockchain,
    descriptionTrigger:
        'User clicks the `Explore in blockchain` button to view transaction details on a blockchain explorer',
    changelog: [{ version: '23.4.1', notes: 'added' }],
    attributes: {},
};
