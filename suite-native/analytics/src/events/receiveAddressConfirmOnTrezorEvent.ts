import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

// @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
export const receiveAddressConfirmOnTrezorEvent: EventDef<
    {},
    EventType.ReceiveAddressConfirmOnTrezor
> = {
    name: EventType.ReceiveAddressConfirmOnTrezor,
    descriptionTrigger: 'Confirm address on Trezor',
    changelog: [{ version: '23.11.1', notes: 'added' }],
    attributes: {},
};
