import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<string, number>;

export const accountsActiveStakingEvent: EventDef<Attributes, EventType.AccountsActiveStaking> = {
    name: EventType.AccountsActiveStaking,
    descriptionTrigger: 'Application completes discovery of all accounts after app start, coin addition, or account creation, tracking accounts with active staking positions',
    changelog: [{ version: '25.10.0', notes: 'added' }],
};
