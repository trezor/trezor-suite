import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const passphraseTryAgainEvent: EventDef<Attributes, EventType.PassphraseTryAgain> = {
    name: EventType.PassphraseTryAgain,
    descriptionTrigger:
        'User enters passphrase to empty wallet and presses Try again to return to initial form.',
    changelog: [{ version: '24.7.2', notes: 'added' }],
    attributes: {},
};
