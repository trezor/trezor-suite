import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const passphraseAddHiddenWalletEvent: EventDef<
    Attributes,
    EventType.PassphraseAddHiddenWallet
> = {
    name: EventType.PassphraseAddHiddenWallet,
    descriptionTrigger: 'User successfully creates a hidden wallet using a passphrase',
    changelog: [{ version: '26.2.2', notes: 'added' }],
    attributes: {},
};
