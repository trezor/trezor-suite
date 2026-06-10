import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<string, number>;

export const accountsStatusEvent: EventDef<Attributes, EventType.AccountsStatus> = {
    name: EventType.AccountsStatus,
    descriptionTrigger:
        'Fired when an account discovery run completes. Reports the number of discovered accounts that have some transaction history, grouped by `{symbol}_{accountType}` (coinjoin counted as taproot). Discovery runs in many scenarios — not only app start: connecting, acquiring or switching a device, adding a standard or hidden (passphrase) wallet, finishing onboarding, enabling or disabling a coin, creating an account or changing its visibility, manually rediscovering, regaining network connectivity, or navigating into the wallet.',
    changelog: [{ version: '1.14.0', notes: 'added' }],
};
