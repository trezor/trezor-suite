import { type PermissionRequest } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../core/AbstractMethod';
import { AbstractMethod } from '../../core/AbstractMethod';

/**
 * `WardSetEntry`: create or replace the WARD entry for (app_id, identifier).
 *
 * THE ACK IS RETURNED VERBATIM. The device answers one of two things and only the caller can
 * decide what to do about it: a leaf with `counter`/`mac`/`auth_commit`, which the caller MUST
 * persist because the device keeps nothing -- or, with no synced session, `queued: true` and
 * none of that, because the device could not pull, prove current state or derive a root and so
 * held the change in its own storage instead. Interpreting `queued` here would mean either
 * inventing a leaf that does not exist or failing a call that succeeded, so this method does
 * neither and leaves the branch to the host.
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
