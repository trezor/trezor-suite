import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const passphraseAddHiddenWalletEvent: EventDef<
    Attributes,
    EventType.PassphraseAddHiddenWallet
> = {
    name: EventType.PassphraseAddHiddenWallet,
    descriptionTrigger: '?',
    changelog: [{ version: '?', notes: 'added' }],
    attributes: {},
};
