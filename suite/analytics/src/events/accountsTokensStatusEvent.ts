import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<string, number>;

export const accountsTokensStatusEvent: EventDef<Attributes, EventType.AccountsTokensStatus> = {
    name: EventType.AccountsTokensStatus,
    descriptionTrigger:
        'Fired when discovery of all accounts is completed (app start, coin added, account added), shows number of accounts with at least 1 token',
    changelog: [{ version: '23.2.1', notes: 'added' }],
};
