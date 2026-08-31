import { type PermissionRequest } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../core/AbstractMethod';
import { AbstractMethod } from '../../core/AbstractMethod';

/**
 * `WardFlushQueue`: publish ONE change the device has been holding.
 *
 * THE OTHER HALF OF THE QUEUE. `wardQueueSetEntry` puts a change into the device's own store with no
 * backend involved; this takes one out and applies it for real. It is not a replay of the queued
 * request: a change made offline has no path, no proof material and no root -- it is an INTENT, and
 * an intent formed while the tree was at one state is not applicable at another. The device
 * re-derives it against current state, which is why this requires a synced session and refuses
 * without one.
 *
 * ONE PER CALL, AND THE CALLER LOOPS. `remaining` is what the loop reads: a queued batch has no
 * transaction to apply under, so one change per round trip bounds a partial application to a single
 * step and makes each step independently retryable. Stop when `remaining` is zero -- a caller that
 * ignores it strands every queued change after the first.
 *
 * NAMED, OR THE NEXT ONE. With no `app_id`/`identifier` the device publishes whatever is next in its
 * queue. Naming an entry is not just a convenience: a COMPACT record keeps a hash of its identity
 * instead of the identity, and a hash cannot be turned back into a keyed path -- so the device
 * refuses to publish one unnamed and says so. The caller holds the identity (in its backup) and can
 * supply it.
 *
 * TWO POSSIBLE ACKS, AND THE `type` SAYS WHICH -- exactly as `wardSetEntry`, and for the same
 * reason. `WardFlushQueueAck` carries the leaf the replica owner must store -- on that build the
 * WARD app is the replica owner; `WardFlushQueueApplied` comes from a build that serves WARD over
 * its own channel, where the device has already published to its daemon and the caller owns no
 * replica to store anything in. Both carry `remaining`, so the
 * draining loop is written once either way.
 *
 * NO CONFIRMATION SCREEN, on the device's side. The user held to confirm when the change was queued,
 * and asking again would be asking about a decision already made.
 */
export default class WardFlushQueue extends AbstractMethod<'wardFlushQueue', PROTO.WardFlushQueue> {
    constructor(message: MethodMessage<'wardFlushQueue'>) {
        const { payload } = message;

        Assert(PROTO.WardFlushQueue, payload);

        // BOTH OR NEITHER is the device's rule, not a schema constraint, so it is not enforced
        // here: the device treats a half-named entry as unnamed, and reproducing that judgement in
        // two places is how the two stop agreeing. Passed through as given.
        const params = {
            app_id: payload.app_id,
            identifier: payload.identifier,
        };

        super(message, params);
    }

    // `management`, as the rest of WARD: publishing a change applies it to the tree, and
    // `GRANTABLE_PERMISSIONS` is the set a 3rd-party app can be given.
    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'management' }];
    }

    get info() {
        return 'Ward flush queue';
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall(
            'WardFlushQueue',
            ['WardFlushQueueAck', 'WardFlushQueueApplied'],
            this.params,
        );

        // The type travels with the message, as in `wardSetEntry`: it is what tells a caller
        // whether the payload is a leaf to keep or a receipt that there is nothing to keep.
        //
        // RETURNED WHOLE rather than rebuilt field by field: `{ type: response.type, message:
        // response.message }` looks identical and is not -- it widens the discriminated pair into
        // one object whose `type` is either name and whose `message` is either shape, which is
        // exactly the "branch on the type" contract collapsing at the type level.
        return response;
    }
}
