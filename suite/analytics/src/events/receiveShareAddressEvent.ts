import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const receiveShareAddressEvent: EventDef<
    Record<never, never>,
    EventType.ReceiveShareAddress
> = {
    name: EventType.ReceiveShareAddress,
    descriptionTrigger: 'User shares a receive address using the system share dialog',
    changelog: [{ version: '26.8.0', notes: 'added' }],

    attributes: {},
};
