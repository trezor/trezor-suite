import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const confirmedReceiveAddressEvent: EventDef<{}, EventType.ConfirmedReceiveAddress> = {
    name: EventType.ConfirmedReceiveAddress,
    descriptionTrigger: 'On receive address confirmed on device',
    changelog: [{ version: '23.4.1', notes: 'added' }],
    attributes: {},
};
