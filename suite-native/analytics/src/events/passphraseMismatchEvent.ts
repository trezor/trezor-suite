import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const passphraseMismatchEvent: EventDef<Attributes, EventType.PassphraseMismatch> = {
    name: EventType.PassphraseMismatch,
    descriptionTrigger:
        'User enters a passphrase to access an empty wallet but enters a different passphrase during verification, causing a mismatch error',
    changelog: [{ version: '24.7.2', notes: 'added' }],
    attributes: {},
};
