import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type AddressFilledMethod = 'manual' | 'qr' | 'qr-erc681';

type Attributes = {
    method: AttributeDef<AddressFilledMethod>;
};

export const sendAddressFilledEvent: EventDef<Attributes, EventType.SendAddressFilled> = {
    name: EventType.SendAddressFilled,
    descriptionTrigger:
        'User fills the recipient address in the send form either by manual entry or by scanning a QR code',
    changelog: [{ version: '24.10.1', notes: 'added' }],
    attributes: {
        method: {
            description: 'How the address was provided: `manual`, `qr`, or `qr-erc681`',
            changelog: [
                { version: '24.10.1', notes: 'added' },
                { version: '26.5.0', notes: 'added qr-erc681 method' },
            ],
        },
    },
};
