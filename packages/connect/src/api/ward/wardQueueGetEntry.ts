import { type PermissionRequest } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../core/AbstractMethod';
import { AbstractMethod } from '../../core/AbstractMethod';

/**
 * `WardQueueGetEntry`: export what the device holds for (app_id, identifier), for backup.
 *
 * WHY A HOST WANTS THIS. A queued change lives in one device's flash and nowhere else, so losing
 * the device loses a change the user confirmed. The ack carries the record and -- for a queued
 * change -- a MAC over all of it, and `wardQueueSetEntry` takes those bytes back only if the MAC
 * verifies. That makes a backup something a host can hold without being able to forge one.
 *
 * NOTHING IS INTERPRETED HERE. The ack is returned verbatim, `mac` included: only the caller knows
 * whether it is taking a backup, showing the user what the device holds, or reconciling its own
 * view of the queue. A record that is present but PINNED comes back without a MAC -- it is not an
 * intent and cannot be restored -- and deciding what to do about that is the caller's business.
 *
 * NO PULL, so no `wardProvider` is involved: the device reads its own store and asks the host for
 * nothing.
 */
export default class WardQueueGetEntry extends AbstractMethod<
    'wardQueueGetEntry',
    PROTO.WardQueueGetEntry
> {
    constructor(message: MethodMessage<'wardQueueGetEntry'>) {
        const { payload } = message;

        Assert(PROTO.WardQueueGetEntry, payload);

        const params = {
            app_id: payload.app_id,
            identifier: payload.identifier,
        };

        super(message, params);
    }

    // As the rest of the WARD queue: what the device holds is device state, and
    // `GRANTABLE_PERMISSIONS` is the set a 3rd-party app can be given -- reading another
    // application's queued changes does not belong in it.
    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'management' }];
    }

    get info() {
        return 'Ward queue get entry';
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('WardQueueGetEntry', 'WardQueueGetAck', this.params);

        return response.message;
    }
}
