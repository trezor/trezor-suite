import { type PermissionRequest } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class AuthLabelChange extends AbstractMethod<
    'authLabelChange',
    PROTO.AuthLabelChange
> {
    constructor(message: MethodMessage<'authLabelChange'>) {
        const { payload } = message;

        Assert(PROTO.AuthLabelChange, payload);

        super(message, {
            kind: payload.kind,
            key_type: payload.key_type,
            key_bytes: payload.key_bytes,
            proof: payload.proof,
            mac: payload.mac,
            new_label_type: payload.new_label_type,
            new_label_value: payload.new_label_value,
        });
    }

    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'read_xpub' }, { permission: 'sign' }];
    }

    get info() {
        return 'Authenticated labeling: change label';
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('AuthLabelChange', 'AuthLabelChangeAck', this.params);

        return response.message;
    }
}
