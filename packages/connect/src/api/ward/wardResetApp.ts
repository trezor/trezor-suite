import { type PermissionRequest } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../core/AbstractMethod';
import { AbstractMethod } from '../../core/AbstractMethod';

/**
 * `WardResetApp`: retire the pinned WARD app, so the next app to make a WARD request may claim it.
 *
 * WHAT IS PINNED. The first host to send a user-facing WARD message is recorded in the device's flash
 * by its static public key, on a held confirmation, and every other host is refused from then on --
 * one party operates WARD on a device, chosen by the user, rather than every host that has ever
 * paired. This is how that choice is undone.
 *
 * THE ONE WARD CALL THAT DOES NOT NEED THE ROLE, and it cannot need it: the reason to make it is that
 * the app holding the role can no longer ask -- its key went with its installation, or the user has
 * moved on. Requiring the role in order to retire it would make the pin unrecoverable, which is the
 * single property it must not have.
 *
 * SO THE DEVICE HOLDS TO CONFIRM, and that screen is the only gate. This request authenticates its
 * sender as "some paired host", which is exactly the granularity the pin exists to improve on, so
 * the device treats it as saying nothing and asks the user instead.
 *
 * NOTHING IS DISCARDED: every entry, queued change, claim and root survives. `was_bound` says whether
 * a pin was actually retired, which success alone does not tell a caller -- resetting a device nobody
 * had claimed would otherwise look like taking something away from an app that was never there.
 */
export default class WardResetApp extends AbstractMethod<'wardResetApp', PROTO.WardResetApp> {
    constructor(message: MethodMessage<'wardResetApp'>) {
        const { payload } = message;

        Assert(PROTO.WardResetApp, payload);

        super(message, {});
    }

    // `management`, as the rest of WARD -- and more plainly than most: this decides which
    // application may use WARD at all, which is not something `GRANTABLE_PERMISSIONS` should ever
    // hand to a 3rd-party app.
    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'management' }];
    }

    get info() {
        return 'Ward reset app';
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('WardResetApp', 'WardResetAppAck', this.params);

        return response.message;
    }
}
