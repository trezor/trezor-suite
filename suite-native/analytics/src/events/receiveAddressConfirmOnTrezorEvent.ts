import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const receiveAddressConfirmOnTrezorEvent: EventDef<
    {},
    EventType.ReceiveAddressConfirmOnTrezor
> = {
    name: EventType.ReceiveAddressConfirmOnTrezor,
    descriptionTrigger: 'Confirm address on Trezor',
    changelog: [{ version: '23.11.1', notes: 'added' }],
    attributes: {},
};
