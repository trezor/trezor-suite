import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const transactionDetailExploreInBlockchainEvent: EventDef<
    Attributes,
    EventType.TransactionDetailExploreInBlockchain
> = {
    name: EventType.TransactionDetailExploreInBlockchain,
    descriptionTrigger: 'On click on Explore in blockchain button.',
    changelog: [{ version: '23.4.1', notes: 'added' }],
    attributes: {},
};
