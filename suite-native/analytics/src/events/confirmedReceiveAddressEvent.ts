import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const confirmedReceiveAddressEvent: EventDef<{}, EventType.ConfirmedReceiveAddress> = {
    name: EventType.ConfirmedReceiveAddress,
    descriptionTrigger: 'Confirm address on Trezor',
    changelog: [{ version: '23.11.1', notes: 'added' }],
    attributes: {},
};
