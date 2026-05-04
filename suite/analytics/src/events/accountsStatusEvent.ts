import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<string, number>;

export const accountsStatusEvent: EventDef<Attributes, EventType.AccountsStatus> = {
    name: EventType.AccountsStatus,
    descriptionTrigger: 'Application completes discovery of all accounts after app start, coin addition, or account creation, tracking accounts with transaction history',
    changelog: [{ version: '1.14.0', notes: 'added' }],
};
