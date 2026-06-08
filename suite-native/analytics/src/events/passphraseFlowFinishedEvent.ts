import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    isEmptyWallet: AttributeDef<boolean>;
};

export const passphraseFlowFinishedEvent: EventDef<Attributes, EventType.PassphraseFlowFinished> = {
    name: EventType.PassphraseFlowFinished,
    descriptionTrigger:
        'User successfully completes the passphrase creation flow and a new hidden wallet is created',
    changelog: [{ version: '24.7.2', notes: 'added' }],
    attributes: {
        isEmptyWallet: {
            changelog: [{ version: '24.7.2', notes: 'added' }],
            description:
                '`true` if discovery did not find any non-empty accounts in the passphrase wallet, `false` if at least one non-empty account was discovered',
        },
    },
};
