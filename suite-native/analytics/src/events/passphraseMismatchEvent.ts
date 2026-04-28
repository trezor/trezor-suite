import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const passphraseMismatchEvent: EventDef<Attributes, EventType.PassphraseMismatch> = {
    name: EventType.PassphraseMismatch,
    descriptionTrigger:
        'When user enters passphrase to empty wallet and during verification enters different passphrase.',
    changelog: [{ version: '24.7.2', notes: 'added' }],
    attributes: {},
};
