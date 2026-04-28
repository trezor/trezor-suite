import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const passphraseEnterOnTrezorEvent: EventDef<Attributes, EventType.PassphraseEnterOnTrezor> =
    {
        name: EventType.PassphraseEnterOnTrezor,
        descriptionTrigger: 'In form, enter on Trezor option was selected.',
        changelog: [{ version: '24.7.2', notes: 'added' }],
        attributes: {},
    };
