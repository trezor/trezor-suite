import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const receiveOpenNonFreshAddressEvent: EventDef<
    Record<never, never>,
    EventType.ReceiveOpenNonFreshAddress
> = {
    name: EventType.ReceiveOpenNonFreshAddress,
    descriptionTrigger: 'User opens a non-fresh address from the receive address list',
    changelog: [{ version: '26.8.1', notes: 'added' }],
    attributes: {},
};
