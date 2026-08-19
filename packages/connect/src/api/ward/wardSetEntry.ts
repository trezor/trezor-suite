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
 * THE ACK IS RETURNED VERBATIM: a leaf with `counter`/`mac`/`auth_commit`, which the caller MUST
 * persist because the device keeps nothing. A result dropped on the floor means the user
 * confirmed a write that never happened.
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
        const response = await cmd.typedCall('WardSetEntry', 'WardLeafAck', this.params);

        return response.message;
    }
}
