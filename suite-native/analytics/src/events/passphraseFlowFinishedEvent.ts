import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    isEmptyWallet: AttributeDef<boolean>;
};

export const passphraseFlowFinishedEvent: EventDef<Attributes, EventType.PassphraseFlowFinished> = {
    name: EventType.PassphraseFlowFinished,
    descriptionTrigger: 'Successfully created passphrase wallet.',
    changelog: [{ version: '24.7.2', notes: 'added' }],
    attributes: {
        isEmptyWallet: {
            changelog: [{ version: '24.7.2', notes: 'added' }],
            description:
                'True if passphrase wallet has no accounts; false if accounts already exist.',
        },
    },
};
