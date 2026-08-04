import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const receiveCopyAddressEvent: EventDef<
    Record<never, never>,
    EventType.ReceiveCopyAddress
> = {
    name: EventType.ReceiveCopyAddress,
    descriptionTrigger: 'User copies a receive address to the clipboard',
    changelog: [{ version: '26.8.1', notes: 'added' }],
    attributes: {},
};
