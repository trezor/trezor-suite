import { type PermissionRequest } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../core/AbstractMethod';
import { AbstractMethod } from '../../core/AbstractMethod';

/**
 * `WardQueueSetEntry`: hold a write on the device until a synced host can publish it.
 *
 * A SEPARATE METHOD FROM `wardSetEntry`, mirroring the wire. The device used to queue a
 * `WardSetEntry` silently whenever the session was unsynced, which meant one call could return
 * either a leaf to store or a receipt to ignore, decided by state the caller cannot see.
 * Queueing is asked for by name now, and its ack type can only mean one thing.
 *
 * THERE IS NOTHING TO STORE IN THE RESULT. `WardQueueSetAck` carries the keyed path and nothing
 * else -- no leaf, no counter, no mac, because none of them can be derived without current
 * state. Keep the path: it is how the host's store is organised, and the host has no other way
 * to learn it. The change itself arrives later, sealed, through `WardFlushQueue`.
 *
 * WITH `mac` THIS IS A RESTORE of a change the device exported for backup. The three fields must be
 * exactly what `WardQueueGetAck` returned, because the device MACs them together with the path and
 * key space it derives itself, and recomputes that before showing the user anything. Pass the export
 * through unchanged rather than rebuilding it field by field: a dropped or altered field is a
 * verification failure, which is the design working, but it reads as a device fault.
 *
 * NO PULL HAPPENS, so no `wardProvider` is involved: the device reads its own store to show what
 * the queued change replaces, and asks the host for nothing.
 */
export default class WardQueueSetEntry extends AbstractMethod<
    'wardQueueSetEntry',
    PROTO.WardQueueSetEntry
> {
    constructor(message: MethodMessage<'wardQueueSetEntry'>) {
        const { payload } = message;

        Assert(PROTO.WardQueueSetEntry, payload);

        const params = {
            app_id: payload.app_id,
            identifier: payload.identifier,
            value: payload.value,
            // Restore only: absent means "queue this fresh". Nothing else travels, because the rest
            // of what the MAC covers is derived on the device and never accepted from a host.
            mac: payload.mac,
            // Keep a hash of the identity on the device instead of the identity, ~40 bytes less
            // flash per record. Such an entry still reads and still backs up; publishing it needs
            // `WardFlushQueue` to be told which entry to publish.
            compact: payload.compact,
        };

        super(message, params);
    }

    // As `wardSetEntry`: a device-held change is device state, and `GRANTABLE_PERMISSIONS` is the
    // set a 3rd-party app can be given -- queueing writes into another application's entries does
    // not belong in it.
    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'management' }];
    }

    get info() {
        return 'Ward queue set entry';
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('WardQueueSetEntry', 'WardQueueSetAck', this.params);

        return response.message;
    }
}
