import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const passphraseArticleOpenedEvent: EventDef<Attributes, EventType.PassphraseArticleOpened> =
    {
        name: EventType.PassphraseArticleOpened,
        descriptionTrigger: 'Click on `How passphrase works` article.',
        changelog: [{ version: '24.7.2', notes: 'added' }],
        attributes: {},
    };
