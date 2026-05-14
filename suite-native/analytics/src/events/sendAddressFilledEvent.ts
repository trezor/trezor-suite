import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type AddressFilledMethod = 'manual' | 'qr' | 'qr-erc681';

type Attributes = {
    method: AttributeDef<AddressFilledMethod>;
};

export const sendAddressFilledEvent: EventDef<Attributes, EventType.SendAddressFilled> = {
    name: EventType.SendAddressFilled,
    descriptionTrigger:
        'Dispatched when user fills the recipient address in send form (manual entry or QR scan).',
    changelog: [{ version: '24.10.1', notes: 'Added' }],
    attributes: {
        method: {
            changelog: [
                { version: '24.10.1', notes: 'added' },
                { version: '26.5.0', notes: 'added qr-erc681 method' },
            ],
        },
    },
};
