import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    isFreshAddress: AttributeDef<boolean>;
};

export const receiveStartVerificationEvent: EventDef<
    Attributes,
    EventType.ReceiveStartVerification
> = {
    name: EventType.ReceiveStartVerification,
    descriptionTrigger: 'User starts verifying a receive address on a Trezor device',
    changelog: [{ version: '26.8.0', notes: 'added' }],

    attributes: {
        isFreshAddress: {
            description:
                'Whether the verified address is the current fresh address or an already revealed one',
            changelog: [{ version: '26.8.0', notes: 'added' }],
        },
    },
};
