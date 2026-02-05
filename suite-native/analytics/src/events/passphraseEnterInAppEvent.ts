import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {};

export const passphraseEnterInAppEvent: EventDef<Attributes, EventType.PassphraseEnterInApp> = {
    name: EventType.PassphraseEnterInApp,
    descriptionTrigger: 'In form, passphrase was entered through form.',
    changelog: [{ version: '24.7.2', notes: 'added' }],
    attributes: {},
};
