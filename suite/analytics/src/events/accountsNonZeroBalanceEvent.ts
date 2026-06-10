import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<string, number>;

export const accountsNonZeroBalanceEvent: EventDef<Attributes, EventType.AccountsNonZeroBalance> = {
    name: EventType.AccountsNonZeroBalance,
    descriptionTrigger:
        'Fired when an account discovery run completes. Reports the number of accounts that hold value — a non-zero coin balance, a non-zero staking balance, or visible tokens — grouped by `{symbol}_{accountType}` (coinjoin counted as taproot). Discovery runs in many scenarios — not only app start: connecting, acquiring or switching a device, adding a standard or hidden (passphrase) wallet, finishing onboarding, enabling or disabling a coin, creating an account or changing its visibility, manually rediscovering, regaining network connectivity, or navigating into the wallet.',
    changelog: [
        { version: '1.23.0', notes: 'added' },
        { version: '23.1.1', notes: 'Tokens included' },
    ],
};
