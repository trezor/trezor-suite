import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const passphraseArticleOpenedEvent: EventDef<Attributes, EventType.PassphraseArticleOpened> =
    {
        name: EventType.PassphraseArticleOpened,
        descriptionTrigger:
            'User clicks to open or view the `How passphrase works` help article for more information',
        changelog: [{ version: '24.7.2', notes: 'added' }],
        attributes: {},
    };
