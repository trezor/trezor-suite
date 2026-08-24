import { type PermissionRequest } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../core/AbstractMethod';
import { AbstractMethod } from '../../core/AbstractMethod';

/**
 * `WardSetEntry`: create or replace the WARD entry for (app_id, identifier).
 *
 * ONLINE ONLY. The device requires a synced session and fails without one, naming
 * `WardQueueSetEntry` -- see `wardQueueSetEntry`. It used to queue silently instead, so this one
 * call could return either a leaf to store or a receipt to ignore depending on state the caller
 * cannot see; a caller could not tell from its own request whether the change had applied.
 *
 * EITHER ACK IS RETURNED VERBATIM, AND THE TYPE IS THE ANSWER. Which one comes back is a property
 * of the FIRMWARE, not of the request:
 *
 *   `WardLeafAck`           the ordinary build. A leaf with `counter`/`mac`/`auth_commit`, which
 *                           the caller MUST persist because the device keeps nothing -- a result
 *                           dropped on the floor means the user confirmed a write that never
 *                           happened.
 *
 *   `WardMutationApplied`   a build that serves WARD over its own channel. The device has already
 *                           published the mutation to its daemon and heard it attested, so there is
 *                           nothing for this caller to store and nothing it could usefully keep: it
 *                           does not own the replica, and a copy would be stale from the next
 *                           write on. `entry_key` and `counter` say what happened, and that is all.
 *
 * SO THE NAME OF THE ACK IS PART OF THE RESULT, and this method returns `{ type, message }` rather
 * than the message alone. A caller has to branch on it -- the two payloads overlap in `entry_key`
 * and `counter`, so a caller left to guess from the fields would be sniffing the shape of a message
 * whose meaning is "store this" in one case and "nothing to store" in the other. The wire keeps
 * them apart as two messages precisely so that nobody has to: an emptied `WardLeafAck` would have
 * been worse than unhelpful, since a replica owner's `apply` reads an absent content body as a
 * DELETION and a service build's receipt would then have erased the entry it just wrote.
 *
 * WHICH TRANSPORT A FIRMWARE USES IS NOT REPORTED, deliberately -- a host that had to be told could
 * be lied to about it -- so this method accepts both and lets the ack speak.
 *
 * THE CALLER HERE IS THE WARD APP, never a wallet. WARD's user-facing operations belong to the
 * application the user reaches WARD through; a wallet on the same connection is not part of the
 * protocol and proxies none of it. See `docs/core/misc/ward-channels.md` in trezor-firmware.
 *
 * NO PULL HANDLING IS NEEDED HERE. When the session IS synced the device interrupts this call
 * with a `WardEntryRequest`; `DeviceCurrentSession` answers it from the registered
 * `wardProvider` transparently, so there is nothing to drive from the method. Offline the
 * device never pulls at all.
 */
export default class WardSetEntry extends AbstractMethod<'wardSetEntry', PROTO.WardSetEntry> {
    constructor(message: MethodMessage<'wardSetEntry'>) {
        const { payload } = message;

        Assert(PROTO.WardSetEntry, payload);

        const params = {
            app_id: payload.app_id,
            identifier: payload.identifier,
            value: payload.value,
        };

        super(message, params);
    }

    // `management` rather than a grantable scope: a WARD write changes device-held state, and
    // `GRANTABLE_PERMISSIONS` is the set a 3rd-party app can be given -- writing another
    // application's entries does not belong in it.
    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'management' }];
    }

    get info() {
        return 'Ward set entry';
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        // BOTH EXPECTED TYPES, not one with a fallback: an unexpected type is a protocol error
        // here, and naming the two legitimate answers is what keeps it one.
        const response = await cmd.typedCall(
            'WardSetEntry',
            ['WardLeafAck', 'WardMutationApplied'],
            this.params,
        );

        // TYPE AND MESSAGE BOTH, unlike every other WARD method here. See above: the type is the
        // half of the answer that says whether the message is something to keep.
        //
        // RETURNED WHOLE rather than rebuilt field by field: `{ type: response.type, message:
        // response.message }` looks identical and is not -- it widens the discriminated pair into
        // one object whose `type` is either name and whose `message` is either shape, which is
        // exactly the "branch on the type" contract collapsing at the type level.
        return response;
    }
}
