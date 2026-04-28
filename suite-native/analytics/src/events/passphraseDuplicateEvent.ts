import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const passphraseDuplicateEvent: EventDef<Attributes, EventType.PassphraseDuplicate> = {
    name: EventType.PassphraseDuplicate,
    descriptionTrigger: 'When user enters passphrase to a wallet that is already present.',
    changelog: [{ version: '24.7.2', notes: 'added' }],
    attributes: {},
};
