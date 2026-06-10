import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const passphraseEnterOnTrezorEvent: EventDef<Attributes, EventType.PassphraseEnterOnTrezor> =
    {
        name: EventType.PassphraseEnterOnTrezor,
        descriptionTrigger:
            'User selects the `Enter passphrase on Trezor` option in the passphrase dialog',
        changelog: [{ version: '24.7.2', notes: 'added' }],
        attributes: {},
    };
