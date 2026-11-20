import { type PermissionRequest } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../core/AbstractMethod';
import { AbstractMethod } from '../../core/AbstractMethod';

/**
 * `WardSetPointer`: make (app_id, identifier) point at (app_id, target_identifier).
 *
 * A read of the pointer returns the target's value: the device follows it one hop against the same
 * root. The target is always in the caller's own app_id and need not exist yet. Online only, and
 * the two acks mean what they mean for `wardSetEntry`, so the result is `{ type, message }` too.
 */
export default class WardSetPointer extends AbstractMethod<'wardSetPointer', PROTO.WardSetPointer> {
    constructor(message: MethodMessage<'wardSetPointer'>) {
        const { payload } = message;

        Assert(PROTO.WardSetPointer, payload);

        const params = {
            app_id: payload.app_id,
            identifier: payload.identifier,
            target_identifier: payload.target_identifier,
        };

        super(message, params);
    }

    // As `wardSetEntry`: a WARD write changes device-held state.
    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'management' }];
    }

    get info() {
        return 'Ward set pointer';
    }

    async run() {
        const cmd = this.getDevice().getCommands();

        return await cmd.typedCall(
            'WardSetPointer',
            ['WardLeafAck', 'WardMutationApplied'],
            this.params,
        );
    }
}
