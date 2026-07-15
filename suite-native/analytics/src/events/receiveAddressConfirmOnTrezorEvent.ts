import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const receiveAddressConfirmOnTrezorEvent: EventDef<
    Record<never, never>,
    EventType.ReceiveAddressConfirmOnTrezor
> = {
    name: EventType.ReceiveAddressConfirmOnTrezor,
    descriptionTrigger:
        'User confirms a receive address on the Trezor device hardware before completing a receive transaction',
    changelog: [{ version: '23.11.1', notes: 'added' }],
    attributes: {},
};
