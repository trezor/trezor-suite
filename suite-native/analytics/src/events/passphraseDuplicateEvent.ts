import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const passphraseDuplicateEvent: EventDef<Attributes, EventType.PassphraseDuplicate> = {
    name: EventType.PassphraseDuplicate,
    descriptionTrigger:
        'User enters a passphrase that matches an existing hidden wallet, indicating a duplicate passphrase is detected',
    changelog: [{ version: '24.7.2', notes: 'added' }],
    attributes: {},
};
