import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const receiveStartVerificationEvent: EventDef<
    Record<never, never>,
    EventType.ReceiveStartVerification
> = {
    name: EventType.ReceiveStartVerification,
    descriptionTrigger: 'User starts verifying a receive address on a Trezor device',
    changelog: [{ version: '26.8.1', notes: 'added' }],
    attributes: {},
};
