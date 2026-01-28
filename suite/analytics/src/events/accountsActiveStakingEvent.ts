import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<string, number>;

export const accountsActiveStakingEvent: EventDef<Attributes, EventType.AccountsActiveStaking> = {
    name: EventType.AccountsActiveStaking,
    descriptionTrigger:
        'Fired when discovery of all accounts is completed (app start, coin added, account added), shows number of specific accounts with staking.',
    changelog: [{ version: '25.10.0', notes: 'added' }],
};
