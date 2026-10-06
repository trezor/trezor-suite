import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    isFreshAddress: AttributeDef<boolean>;
};

export const receiveCopyAddressEvent: EventDef<Attributes, EventType.ReceiveCopyAddress> = {
    name: EventType.ReceiveCopyAddress,
    descriptionTrigger: 'User copies a receive address to the clipboard',
    changelog: [{ version: '26.8.0', notes: 'added' }],

    attributes: {
        isFreshAddress: {
            description:
                'Whether the copied address is the current fresh address or an already revealed one',
            changelog: [{ version: '26.8.0', notes: 'added' }],
        },
    },
};
