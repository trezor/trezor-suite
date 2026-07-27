import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    screen: AttributeDef<string>;
};

export const passphraseExitEvent: EventDef<Attributes, EventType.PassphraseExit> = {
    name: EventType.PassphraseExit,
    descriptionTrigger:
        'User exits the passphrase creation flow without completing wallet addition',
    changelog: [{ version: '24.7.2', notes: 'added' }],
    attributes: {
        screen: {
            changelog: [{ version: '24.7.2', notes: 'added' }],

            description:
                'Screen route name or identifier where the user exited the passphrase flow (e.g., `PassphraseForm`, `PassphraseConfirmOnTrezor`, `PassphraseEmptyWallet`, `PassphraseLoading`, `PassphraseStack`, `PassphraseVerifyEmptyWallet`, `PassphraseRedirecting`)',
        },
    },
};
