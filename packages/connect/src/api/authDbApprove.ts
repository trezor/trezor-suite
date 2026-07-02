import { type MethodPermission } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class AuthDbApprove extends AbstractMethod<'authDbApprove', PROTO.AuthDbApprove> {
    constructor(message: MethodMessage<'authDbApprove'>) {
        const { payload } = message;
        Assert(PROTO.AuthDbApprove, payload);

        const params = {
            address: payload.address,
            value: payload.value,
        };

        super(message, params);
        this.useDeviceState = false;
        this.useEmptyPassphrase = true;
    }

    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    get info() {
        return 'Approve address-database record';
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('AuthDbApprove', 'AuthDbApproveResponse', this.params);

        return response.message;
    }
}
