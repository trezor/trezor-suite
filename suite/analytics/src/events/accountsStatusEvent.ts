import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<string, number>;

export const accountsStatusEvent: EventDef<Attributes, EventType.AccountsStatus> = {
    name: EventType.AccountsStatus,
    descriptionTrigger:
        'Fired when discovery of all accounts is completed (app start, coin added, account added), shows number of specific accounts with some transaction history',
    changelog: [{ version: '1.14.0', notes: 'added' }],
};
