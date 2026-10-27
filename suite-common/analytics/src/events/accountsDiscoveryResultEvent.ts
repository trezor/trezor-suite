import { type DiscoveryOutcome, type DiscoveryTrigger } from '@suite-common/wallet-types';

import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    outcome: AttributeDef<DiscoveryOutcome>;
    trigger: AttributeDef<DiscoveryTrigger>;
    errorCode?: AttributeDef<string>;
};

export const accountsDiscoveryResultEvent: EventDef<Attributes, EventType.AccountsDiscoveryResult> =
    {
        name: EventType.AccountsDiscoveryResult,
        descriptionTrigger:
            'Fired once per account discovery run on desktop, web and mobile when the run reaches an outcome, whether the wallet loaded or not. A run starts whenever discovery is started or restarted, see `trigger`. Internal restarts inside the passphrase flow and the rollback of a failed network activation are not reported as separate outcomes.',
        changelog: [{ version: '26.11.0', notes: 'added' }],

        attributes: {
            outcome: {
                changelog: [{ version: '26.11.0', notes: 'added' }],
                description:
                    'How the run ended: `complete`, `failed`, `cancelled` by the user or the device, `passphrase-mismatch` when the passphrase confirmation did not match, or `passphrase-duplicate` when the passphrase opened an already added wallet',
            },
            trigger: {
                changelog: [{ version: '26.11.0', notes: 'added' }],
                description:
                    'What started the run: `device-connect` (device connected or acquired, including app start), `device-switch`, `device-check` (a device authenticity or entropy check finished or was dismissed), `resume` (discovery resumed after leaving a screen or flow that blocks it, desktop only), `coin-toggle`, `account-update` (an account changed and further accounts may be discoverable), `add-wallet` (standard or hidden wallet, including passphrase retries), `add-account`, `retry` (user retried a failed discovery), `reconnect` (connectivity regained, desktop only) or `onboarding` (desktop onboarding finished, or mobile wallet created or recovered)',
            },
            errorCode: {
                changelog: [{ version: '26.11.0', notes: 'added' }],
                description:
                    'Trezor Connect error code of the failure, e.g. `Device_Disconnected` or `Backend_Error`; `Failure_UnknownCode` when the failure carries no code or one outside the Trezor Connect, firmware and THP error codes. Sent only when `outcome` is `failed`. The error message is never sent',
            },
        },
    };
