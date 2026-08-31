import { type PermissionRequest } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../core/AbstractMethod';
import { AbstractMethod } from '../../core/AbstractMethod';

/**
 * `WardQueueDeleteEntry`: DISCARD a queued change.
 *
 * NOT A WARD DELETION. Nothing here touches the trie: the change being discarded was never
 * published, so no leaf, root or counter is involved. `wardSetEntry` with an empty value is not the
 * same thing either -- removing an entry from the tree is `WardDeleteEntry`, which requires a synced
 * session.
 *
 * PENDING RECORDS ONLY. A copy the user pinned for offline reading sits in the same device store and
 * is deliberately out of reach: the device reports `missing` and leaves it alone, because "do not
 * publish this change" and "stop keeping this value here" are different questions.
 *
 * `missing` IS AN ANSWER, NOT A FAILURE, and the ack carries it rather than the call throwing: a
 * host reconciling its own view of the queue will legitimately ask about a change that has already
 * been published, and a Failure would make that ordinary case look like a fault.
 */
export default class WardQueueDeleteEntry extends AbstractMethod<
    'wardQueueDeleteEntry',
    PROTO.WardQueueDeleteEntry
> {
    constructor(message: MethodMessage<'wardQueueDeleteEntry'>) {
        const { payload } = message;

        Assert(PROTO.WardQueueDeleteEntry, payload);

        const params = {
            app_id: payload.app_id,
            identifier: payload.identifier,
        };

        super(message, params);
    }

    // As the rest of the WARD queue: this changes device state, and `GRANTABLE_PERMISSIONS` is the
    // set a 3rd-party app can be given -- discarding another application's queued change does not
    // belong in it.
    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'management' }];
    }

    get info() {
        return 'Ward queue delete entry';
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall(
            'WardQueueDeleteEntry',
            'WardQueueDeleteAck',
            this.params,
        );

        return response.message;
    }
}
