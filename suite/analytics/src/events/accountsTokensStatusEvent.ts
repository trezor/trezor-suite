import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<string, number>;

export const accountsTokensStatusEvent: EventDef<Attributes, EventType.AccountsTokensStatus> = {
    name: EventType.AccountsTokensStatus,
    descriptionTrigger: 'Application completes discovery of all accounts after app start, coin addition, or account creation, tracking accounts with token holdings',
    changelog: [{ version: '23.2.1', notes: 'added' }],
};
