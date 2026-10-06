import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const receiveAddAddressEvent: EventDef<Record<never, never>, EventType.ReceiveAddAddress> = {
    name: EventType.ReceiveAddAddress,
    descriptionTrigger: 'User adds another address to the receive address list',
    changelog: [{ version: '26.8.1', notes: 'added' }],
    attributes: {},
};
