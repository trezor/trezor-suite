import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const passphraseEnterInAppEvent: EventDef<Attributes, EventType.PassphraseEnterInApp> = {
    name: EventType.PassphraseEnterInApp,
    descriptionTrigger:
        'User enters a passphrase into the passphrase input form during wallet access',
    changelog: [{ version: '24.7.2', notes: 'added' }],
    attributes: {},
};
