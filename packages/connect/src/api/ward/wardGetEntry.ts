import { type PermissionRequest } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../core/AbstractMethod';
import { AbstractMethod } from '../../core/AbstractMethod';

/**
 * `WardGetEntry`: show the WARD entry for (app_id, identifier) on the device.
 *
 * ONLINE ONLY. The device pulls the entry, verifies it against the root the session trusts, and
 * refuses outright without a synced session -- it does not fall back to its own store, because a
 * host able to turn a failed pull into a local read could choose which of the two a user sees.
 * The offline read is a different call: `wardQueueGetEntry`.
 *
 * THE ACK IS `Success` AND CARRIES NO VALUE. The device shows the entry and keeps it. Nothing to
 * interpret here, and nothing for a caller to store.
 *
 * NO PULL HANDLING IS NEEDED HERE, and there are two reasons rather than one. On an ordinary build
 * the device interrupts this call with `WardEntryRequest` and `DeviceCurrentSession` answers it
 * from the registered `wardProvider` transparently. On a build that serves WARD over its own
 * interface no interruption arrives at all: the device asks its daemon, and this host is not part
 * of the exchange. Which of the two is happening is a property of the firmware, which deliberately
 * does not report it -- so this method is written not to care.
 */
export default class WardGetEntry extends AbstractMethod<'wardGetEntry', PROTO.WardGetEntry> {
    constructor(message: MethodMessage<'wardGetEntry'>) {
        const { payload } = message;

        Assert(PROTO.WardGetEntry, payload);

        const params = {
            app_id: payload.app_id,
            identifier: payload.identifier,
        };

        super(message, params);
    }

    // `management`, as the rest of WARD: `GRANTABLE_PERMISSIONS` is the set a 3rd-party app can be
    // given, and putting another application's entries on screen does not belong in it.
    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'management' }];
    }

    get info() {
        return 'Ward get entry';
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('WardGetEntry', 'Success', this.params);

        return response.message;
    }
}
