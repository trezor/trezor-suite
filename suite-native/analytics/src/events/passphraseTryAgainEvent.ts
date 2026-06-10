import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const passphraseTryAgainEvent: EventDef<Attributes, EventType.PassphraseTryAgain> = {
    name: EventType.PassphraseTryAgain,
    descriptionTrigger:
        'User enters a passphrase to access an empty wallet and clicks `Try again` to return to the initial passphrase entry form',
    changelog: [{ version: '24.7.2', notes: 'added' }],
    attributes: {},
};
