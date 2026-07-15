import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<string, number>;

export const accountsTokensStatusEvent: EventDef<Attributes, EventType.AccountsTokensStatus> = {
    name: EventType.AccountsTokensStatus,
    descriptionTrigger:
        'Fired when an account discovery run completes. Reports the number of accounts holding at least one visible token, grouped by `{symbol}_{accountType}` (coinjoin counted as taproot). Discovery runs in many scenarios — not only app start: connecting, acquiring or switching a device, adding a standard or hidden (passphrase) wallet, finishing onboarding, enabling or disabling a coin, creating an account or changing its visibility, manually rediscovering, regaining network connectivity, or navigating into the wallet.',
    changelog: [{ version: '23.2.1', notes: 'added' }],
};
