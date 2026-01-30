import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const transactionDetailExploreInBlockchainEvent: EventDef<
    undefined,
    EventType.TransactionDetailExploreInBlockchain
> = {
    name: EventType.TransactionDetailExploreInBlockchain,
    descriptionTrigger: 'On explore in blockchain button click',
    changelog: [{ version: '23.4.1', notes: 'added' }],
};
