import { type PermissionRequest } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class AuthLabelShow extends AbstractMethod<'authLabelShow', PROTO.AuthLabelShow> {
    constructor(message: MethodMessage<'authLabelShow'>) {
        const { payload } = message;

        Assert(PROTO.AuthLabelShow, payload);

        super(message, {
            key_type: payload.key_type,
            key_bytes: payload.key_bytes,
            proof: payload.proof,
            mac: payload.mac,
        });
    }

    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'read_xpub' }];
    }

    get info() {
        return 'Authenticated labeling: show label';
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('AuthLabelShow', 'AuthLabelShowAck', this.params);

        return response.message;
    }
}
